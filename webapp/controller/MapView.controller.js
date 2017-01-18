sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
	"use strict";
	var _this,
		address = "",
		canAvail = false;
	var inpSearch, butOk;

	var GoogleMaps = {
		_data: {
			locSAP: {
				lat: 12.978778,
				lng: 77.715439
			}
		},
		_callbacks: {
			onClick: function(lat, long) {
				console.log("Clicked location: " + lat + "°N " + long + "°E");
			},
			onRoute: function(address, distance) {
				console.log("Address is " + address + " and Distance from SAP is " + distance + " km");
			}
		},
		_helper: {
			drawRoute: function(lat, long) {
				var destination = {
					lat: lat,
					lng: long
				};
				GoogleMaps._directionsService.route({
					origin: GoogleMaps._data.locSAP,
					destination: destination,
					travelMode: 'TRANSIT'
				}, function(result, sttus) {
					if (sttus === 'OK') {
						GoogleMaps._directionsDisplay.setDirections(result);
					}
				});
			},
			setMarker: function(lat, long) {
				// var markLatLong = new google.maps.LatLng(lat, long);
				// GoogleMaps._marker.setPosition(markLatLong);
				// GoogleMaps._map.panTo(markLatLong);
				GoogleMaps._helper.drawRoute(lat, long);
			}
		},
		_geocoder: null,
		_map: null,
		_marker: null,
		_autocompleteService: null,
		_distanceService: null,
		_directionsService: null,
		_directionsDisplay: null,
		init: function(divInst, onClickCallback, onRouteCallback) {
			GoogleMaps._geocoder = new google.maps.Geocoder();
			GoogleMaps._map = new google.maps.Map(divInst, {
				center: GoogleMaps._data.locSAP,
				zoom: 17,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});
			GoogleMaps._autocompleteService = new google.maps.places.AutocompleteService();
			GoogleMaps._distanceService = new google.maps.DistanceMatrixService();
			GoogleMaps._directionsService = new google.maps.DirectionsService();
			GoogleMaps._directionsDisplay = new google.maps.DirectionsRenderer();
			GoogleMaps._directionsDisplay.setMap(GoogleMaps._map);
			GoogleMaps._marker = new google.maps.Marker({
				map: GoogleMaps._map
			});
			google.maps.event.addListener(GoogleMaps._map, 'click', function(event) {
				GoogleMaps.getRouteTo({
					lat: event.latLng.lat(),
					lng: event.latLng.lng()
				});
				if (GoogleMaps._callbacks.onClick && typeof GoogleMaps._callbacks.onClick === "function") {
					GoogleMaps._callbacks.onClick(event.latLng.lat(), event.latLng.lng());
				}
			});
			if (onClickCallback && typeof onClickCallback === "function") {
				GoogleMaps._callbacks.onClick = onClickCallback;
			}
			if (onRouteCallback && typeof onRouteCallback === "function") {
				GoogleMaps._callbacks.onRoute = onRouteCallback;
			}
		},
		getPlaceSuggestions: function(queryInp, onSuggestionsCallback) {
			GoogleMaps._autocompleteService.getQueryPredictions({
				input: queryInp,
				location: new google.maps.LatLng(GoogleMaps._data.locSAP),
				radius: 50000
			}, function(QueryAutocompletePrediction, PlacesServiceStatus) {
				if (onSuggestionsCallback && typeof onSuggestionsCallback === "function") {
					onSuggestionsCallback(QueryAutocompletePrediction);
				}
			});
		},
		resolvePlace: function(placeId, onResolveCallback) {
			GoogleMaps._geocoder.geocode({
				placeId: placeId
			}, function(results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					if (onResolveCallback && typeof onResolveCallback === "function") {
						onResolveCallback(results[0].geometry.location.lat(), results[0].geometry.location.lng());
					}
				} else {
					alert("Geocode was not successful for the following reason: " + status);
				}
			});
		},
		getRouteTo: function(destination) {
			if (typeof destination === "string") {
				return GoogleMaps.resolvePlace(destination, function(lat, lng) {
					GoogleMaps.getRouteTo({
						lat: lat,
						lng: lng
					});
				});
			}
			GoogleMaps._helper.setMarker(destination.lat, destination.lng);
			GoogleMaps._distanceService.getDistanceMatrix({
				origins: [GoogleMaps._data.locSAP],
				destinations: [destination],
				travelMode: 'TRANSIT',
				unitSystem: google.maps.UnitSystem.METRIC,
				avoidHighways: false,
				avoidTolls: false
			}, function(response, status) {
				if (status !== 'OK') {
					alert('Error: ' + status);
				} else {
					var _distance = parseFloat(response.rows[0].elements[0].distance.text.split(" km")[0]);
					if (GoogleMaps._callbacks.onRoute && typeof GoogleMaps._callbacks.onRoute === "function") {
						GoogleMaps._callbacks.onRoute(response.destinationAddresses[0], _distance);
					}
				}
			});
		}

	};
	return Controller.extend("com.sap.scholar2016.cabmini.controller.MapView", {
		onInit: function() {
			_this = this;
			inpSearch = this.getView().byId("inpSearch"),
				butOk = this.getView().byId("btnOK");
		},
		onPressOk: function() {
			var oModel = sap.ui.getCore().getModel("mapData");
			oModel.setProperty('/cab/address', address);
			oModel.setProperty('/cab/canAvail', canAvail);
			sap.ui.getCore().setModel(oModel, "mapData");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
			oRouter.navTo("userEntryView");
		},
		onAfterRendering: function() {
			GoogleMaps.init(this.getView().byId("map_canvas").getDomRef(), null, _this.onPlaceSelected);
		},
		onSuggest: function(oEvent) {
			GoogleMaps.getPlaceSuggestions(oEvent.getParameters().suggestValue, _this.onSuggestions);
		},
		onSuggestions: function(suggestArray) {
			var tempModel = new JSONModel(suggestArray);
			inpSearch.setModel(tempModel);
		},
		onSuggestSelected: function(oEvent) {
			GoogleMaps.getRouteTo(oEvent.getParameters().selectedItem.getKey());
		},
		onPlaceSelected: function(selAddress, distance) {
			address = selAddress;
			canAvail = (distance >= 8.0) ? true : false;
			inpSearch.setValue(address);
		}
	});

});