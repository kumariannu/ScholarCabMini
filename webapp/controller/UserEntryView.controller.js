sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	'sap/m/Dialog',
	'sap/m/Button',
	'sap/m/Text'
], function(Controller, JSONModel, Filter, Dialog, Button, Text) {
	"use strict";
	var _view,
		emptyUser = {
			username: "",
			name: "",
			email: "",
			cab: {
				address: "",
				distance: 0,
				canAvail: false,
				availed: false
			}
		};

	var DB = {
		queryData: function(inputUsername) {
			var oModel = _view.getModel(),
				dataObj = JSON.parse(oModel.getJSON());
			for (var i = 0; i < dataObj.userList.length; i++) {
				if (dataObj.userList[i].username === inputUsername.toUpperCase()) {
					return dataObj.userList[i];
				}
			}
			return null;
		},
		updateData: function(inputUsername, userData) {
			var oModel = _view.getModel(),
				dataObj = JSON.parse(oModel.getJSON());
			for (var i = 0; i < dataObj.userList.length; i++) {
				if (dataObj.userList[i].username === inputUsername.toUpperCase()) {
					dataObj.userList[i] = userData;
					oModel.setProperty('/userList', dataObj.userList);
					return true;
				}
			}
			return false;
		}
	};

	return Controller.extend("com.sap.scholar2016.cabmini.controller.UserEntryView", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.sap.scholar2016.cabmini.view.UserEntryView
		 */
		onInit: function() {
			var oModel = new JSONModel();
			oModel.loadData("json/users.json");
			this.getView().setModel(oModel);
			_view = this.getView();

			var binding = new sap.ui.model.Binding(oModel, "/currentUser/cab/canAvail", oModel.getContext("/"));
			binding.attachChange(function() {
				_view.byId("sw_avail").setEnabled(JSON.parse(oModel.getJSON()).currentUser.cab.canAvail);
				if (!JSON.parse(oModel.getJSON()).currentUser.cab.canAvail) {
					_view.byId("sw_avail").setState(false);
				}
			});

			var oData = {
					cab: {
						address: "",
						canAvail: false
					}
				},
				oVModel = new JSONModel();
			oVModel.setData(oData);
			sap.ui.getCore().setModel(oVModel, "mapData");
			var oTModel = sap.ui.getCore().getModel("mapData");
			var bind = new sap.ui.model.Binding(oTModel, "/cab", oTModel.getContext("/"));
			bind.attachChange(function() {
				var dataObj = JSON.parse(sap.ui.getCore().getModel("mapData").getJSON());
				console.log(dataObj);
				oModel.setProperty('/currentUser/cab/address', dataObj.cab.address);
				oModel.setProperty('/currentUser/cab/canAvail', dataObj.cab.canAvail);
				_view.setModel(oModel);
				_view.byId('btnSave').setEnabled(dataObj.cab.address !== "");
			});

			_view.byId('btnSave').setEnabled(false);
			_view.byId('btnAddress').setEnabled(false);
		},
		onUsernameValidate: function(oEvent) {
			var usernameInput = _view.byId("usernameInput"),
				oModel = _view.getModel(),
				txt = oEvent.getParameters().value,
				result = DB.queryData(txt),
				valid = true;
			if (!result) {
				result = emptyUser;
				valid = false;
			}
			oModel.setProperty('/currentUser', result);
			_view.setModel(oModel);
			usernameInput.setValueState(valid ? "None" : "Error");
			_view.byId('btnSave').setEnabled(JSON.parse(_view.getModel().getJSON()).currentUser.cab.address !== "");
			_view.byId('btnAddress').setEnabled(valid);
		},
		onSaveChanges: function(oEvent) {
			var oModel = _view.getModel();
			var dataObj = JSON.parse(oModel.getJSON());
			DB.updateData(dataObj.currentUser.username, dataObj.currentUser);
			var dialog = new Dialog({
				title: 'Scholar Cab Booking',
				type: 'Message',
				state: dataObj.currentUser.cab.canAvail ? (dataObj.currentUser.cab.availed ? 'Success' : 'Warning') : 'Error',
				content: new Text({
					text: dataObj.currentUser.cab.canAvail ? (dataObj.currentUser.cab.availed ? 'Cab request accepted!' :
						'Cab request cancelled!') : 'You are within 8Km from SAP \n Request for cab is denied!'
				}),
				beginButton: new Button({
					text: 'OK',
					press: function() {
						dialog.close();
						oModel.setProperty('/currentUser', emptyUser);
						_view.setModel(oModel);
						_view.byId('btnSave').setEnabled(false);
						_view.byId('btnAddress').setEnabled(false);
						_view.byId('sw_avail').setEnabled(false);
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		onSelectAddress: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("mapView");
		}
	});

});