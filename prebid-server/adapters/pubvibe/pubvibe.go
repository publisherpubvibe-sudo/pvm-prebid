package pubvibe

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/prebid/prebid-server/adapters"
	"github.com/prebid/prebid-server/config"
	"github.com/prebid/prebid-server/errortypes"
	"github.com/prebid/prebid-server/openrtb_ext"
	"github.com/prebid/openrtb/v20/openrtb2"
)

// -----------------------------------------------------------------------
// PubVibe SSP Adapter – oRTB 2.5 compliant
// Supports 4 regional endpoints:
//   US East  – rtb-useast.trackifyy.com
//   US West  – rtb-uswest.trackifyy.com
//   EU       – rtb-eu.trackifyy.com
//   APAC     – rtb-apac.trackifyy.com
// -----------------------------------------------------------------------

type adapter struct {
	endpoint string
}

// ExtImpPubVibe holds publisher-supplied impression-level params.
type ExtImpPubVibe struct {
	ZoneID   string `json:"zoneId"`
	Region   string `json:"region,omitempty"` // useast | uswest | eu | apac
	PubID    string `json:"pubId"`
}

var regionalEndpoints = map[string]string{
	"useast": "https://rtb-useast.trackifyy.com/rtb",
	"uswest": "https://rtb-uswest.trackifyy.com/rtb",
	"eu":     "https://rtb-eu.trackifyy.com/rtb",
	"apac":   "https://rtb-apac.trackifyy.com/rtb",
}

// Builder is the entry point registered by Prebid Server.
func Builder(bidderName openrtb_ext.BidderName, config config.Adapter) (adapters.Bidder, error) {
	bidder := &adapter{
		endpoint: config.Endpoint,
	}
	return bidder, nil
}

// MakeRequests translates the incoming BidRequest into one or more HTTP
// requests to PubVibe regional endpoints.
func (a *adapter) MakeRequests(request *openrtb2.BidRequest, requestInfo *adapters.ExtraRequestInfo) ([]*adapters.RequestData, []error) {
	var errs []error
	// Group impressions by region
	regionImps := make(map[string][]openrtb2.Imp)

	for i, imp := range request.Imp {
		var bidderExt adapters.ExtImpBidder
		if err := json.Unmarshal(imp.Ext, &bidderExt); err != nil {
			errs = append(errs, &errortypes.BadInput{
				Message: fmt.Sprintf("imp %d: failed to parse ext: %s", i, err),
			})
			continue
		}

		var impExt ExtImpPubVibe
		if err := json.Unmarshal(bidderExt.Bidder, &impExt); err != nil {
			errs = append(errs, &errortypes.BadInput{
				Message: fmt.Sprintf("imp %d: failed to parse pubvibe ext: %s", i, err),
			})
			continue
		}

		region := "useast" // default region
		if impExt.Region != "" {
			region = impExt.Region
		}

		// Attach zone to imp
		newImp := imp
		newImp.TagID = impExt.ZoneID
		regionImps[region] = append(regionImps[region], newImp)
	}

	var requests []*adapters.RequestData
	for region, imps := range regionImps {
		endpoint, ok := regionalEndpoints[region]
		if !ok {
			endpoint = a.endpoint
		}

		reqCopy := *request
		reqCopy.Imp = imps

		body, err := json.Marshal(reqCopy)
		if err != nil {
			errs = append(errs, err)
			continue
		}

		requests = append(requests, &adapters.RequestData{
			Method: http.MethodPost,
			Uri:    endpoint,
			Body:   body,
			Headers: http.Header{
				"Content-Type": []string{"application/json;charset=utf-8"},
				"Accept":       []string{"application/json"},
				"X-Prebid-Region": []string{region},
			},
			ImpIDs: openrtb_ext.GetImpIDs(reqCopy.Imp),
		})
	}

	return requests, errs
}

// MakeBids parses the HTTP response from PubVibe and maps it to Prebid bids.
func (a *adapter) MakeBids(request *openrtb2.BidRequest, requestData *adapters.RequestData, response *adapters.ResponseData) (*adapters.BidderResponse, []error) {
	if response.StatusCode == http.StatusNoContent {
		return nil, nil
	}

	if response.StatusCode == http.StatusBadRequest {
		return nil, []error{&errortypes.BadInput{
			Message: fmt.Sprintf("PubVibe bad request: status %d", response.StatusCode),
		}}
	}

	if response.StatusCode != http.StatusOK {
		return nil, []error{&errortypes.BadServerResponse{
			Message: fmt.Sprintf("PubVibe unexpected status: %d", response.StatusCode),
		}}
	}

	var bidResp openrtb2.BidResponse
	if err := json.Unmarshal(response.Body, &bidResp); err != nil {
		return nil, []error{&errortypes.BadServerResponse{
			Message: fmt.Sprintf("failed to unmarshal response: %s", err),
		}}
	}

	bidResponse := adapters.NewBidderResponseWithBidsCapacity(len(request.Imp))

	for _, seatBid := range bidResp.SeatBid {
		for i := range seatBid.Bid {
			bid := &seatBid.Bid[i]
			bidType, err := getMediaTypeForImp(bid.ImpID, request.Imp)
			if err != nil {
				continue
			}
			bidResponse.Bids = append(bidResponse.Bids, &adapters.TypedBid{
				Bid:     bid,
				BidType: bidType,
			})
		}
	}

	return bidResponse, nil
}

func getMediaTypeForImp(impID string, imps []openrtb2.Imp) (openrtb_ext.BidType, error) {
	for _, imp := range imps {
		if imp.ID == impID {
			if imp.Banner != nil {
				return openrtb_ext.BidTypeBanner, nil
			}
			if imp.Video != nil {
				return openrtb_ext.BidTypeVideo, nil
			}
			if imp.Native != nil {
				return openrtb_ext.BidTypeNative, nil
			}
		}
	}
	return "", fmt.Errorf("imp %s not found or no recognized media type", impID)
}
