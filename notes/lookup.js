const connectivity = require("@sap-cloud-sdk/connectivity");
const httpClient = require("@sap-cloud-sdk/http-client");
const axios = require("axios");

async function onReProcessData(aEntityData,cpiPayload,entity){
    const oResponse = {};
    const oDestinationDetails = await getDestinationDetails();
    if (oDestinationDetails.details) {
        const oHttpReq = await httpClient.buildHttpRequest(oDestinationDetails.details);
        oHttpReq.headers["Content-Type"] = "application/json";
        oHttpReq.url = oHttpReq.baseURL.concat("/http/BTP/ErrorReprocessing");
        oHttpReq.method = "post";
        oHttpReq.data = {
            "data": cpiPayload
        };
        const rReprocess = onSendReprocessRequest(oHttpReq);
        if(rReprocess.error){
            oResponse.error = rReprocess.error;
        }
        const aUpDateEntityFields = getDataToUpdate(aEntityData,entity);
        const rStatusUpdate = updateReprocessingCountAndTime(aUpDateEntityFields,entity);
        if (rStatusUpdate.error) {
            oResponse.error = rStatusUpdate.error;
        }
    }else {
        oResponse.error = oDestinationDetails.error;
    }
    
    return oResponse;
};

async function getDestinationDetails(){
    const oDestination = {};
    try {
        const destination = await connectivity.getDestinationFromDestinationService({destinationName:'INTS_EU20_USIB_OAUTH'});
        if(destination){
            oDestination.details = destination;
        }else{
            oDestination.error = "Failed to get destination details.";
        }
    } catch (error) {
        oDestination.error = error.message;
    }
    return oDestination;
};

function onSendReprocessRequest(oHttpReq){
    const rReprocess = {};
    try {
        axios.request(oHttpReq);
    } catch (error) {
        rReprocess.error = error.message;
    }
    return rReprocess;
};

function getDataToUpdate(aEntityData,entity){
    const aDataToUpdate = [];
    const entityKeyFields = Object.keys(entity.keys);
    aEntityData.forEach(singleEntityData => {
        const oRecordUpdate = {
            "lastRetryAt": new Date(),
            "reprocessCount" : singleEntityData.reprocessCount ? parseInt(singleEntityData.reprocessCount,10) + 1 : 0
        };
        entityKeyFields.forEach(key => {
            oRecordUpdate[key] = singleEntityData[key];
        });
        aDataToUpdate.push(oRecordUpdate);
    });
    return aDataToUpdate;
};

async function updateReprocessingCountAndTime(aEntityData,entity) {
    const rResponse = {};
    try {
        await UPSERT.into(entity).entries(aEntityData);
    } catch (error) {
        rResponse.error = error.message;
    }
    return rResponse;
};

module.exports = {
    onReProcessData
};