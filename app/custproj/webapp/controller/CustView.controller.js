sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function (Controller, MessageBox) {
    "use strict";

    return Controller.extend("app.custproj.controller.CustView", {
        onInit() {},

        onSubmit: function () {
            let oView = this.getView(); // ✅ You forgot this line
            let oModel = this.getOwnerComponent().getModel();
            let url = oModel.sServiceUrl + "CUST";

            // Get input field values
            let sCountry = oView.byId("countryInput").getValue();
            let sCurrency = oView.byId("currencyInput").getValue();
            let sCustId = parseInt(oView.byId("custIdInput").getValue());
            let sD = oView.byId("dInput").getValue();
            let sName = oView.byId("nameInput").getValue();

            // Prepare payload
            let payload = {
                COUNTRY: sCountry,
                CURRENCY: sCurrency,
                CUSTID: sCustId,
                GENDER: sD,
                NAME: sName
            };

            // Send data to backend
            $.ajax({
                method: "POST",
                url: url,
                contentType: "application/json", // ✅ Required for JSON payload
                data: JSON.stringify(payload),
                success: function (res) {
                    MessageBox.success("Data inserted successfully");
                    oView.byId("countryInput").setValue("");
                    oView.byId("currencyInput").setValue("");
                    oView.byId("custIdInput").setValue("");
                    oView.byId("dInput").setValue("");
                    oView.byId("nameInput").setValue("");
                },
                error: function (err) {
                    let errorMsg = "Data insertion failed";

                    if (err && err.responseText) {
                        try {
                            let parsed = JSON.parse(err.responseText);
                            if (parsed.error && parsed.error.message) {
                                errorMsg = parsed.error.message;
                            }
                        } catch (e) {
                            console.error("Error parsing responseText", e);
                        }
                    }

                    MessageBox.error(errorMsg);
                }
            });
        }
    });
});
