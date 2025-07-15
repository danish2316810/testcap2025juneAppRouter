const cds = require("@sap/cds");
const uuid = require("uuid");
const objectStoreOperations = require("../../utils/objectStoreOperations");
const buildErrorMessages = require("../../utils/buildErrorMsg");

async function onCreateErrorRecord(req){
    const {data} = req.data;
    const allEntities = cds.entities("opex.ds.usib.db");
    const errorPayload = formErrorData(data.interface, data.fields, allEntities);
    const interFaceEntity = allEntities.InterfaceData;
    const isFieldsMatch = validateErrorFields(errorPayload);
    let returnRes = "";
    if (isFieldsMatch.bNoError) {
        let tableName = errorPayload.entity.split(".");
        tableName = tableName[tableName.length-1];
        errorPayload.data.status_code = data.status;
        returnRes = createErrorDataIntable(req,tableName,errorPayload,interFaceEntity);
    }else {
        req.error(buildErrorMessages.buildErrorWithMsg(isFieldsMatch.error));
    }
    return returnRes;
};

async function createErrorDataIntable(req,tableName,errorPayload,interFaceEntity) {
    let rResponse = "";
    const crtInterfaceAndObj = await createInterfaceAndObjectStoreData(req, tableName, interFaceEntity);
    if (crtInterfaceAndObj.bNoError) {
        errorPayload.data.interfaceDataUUID = crtInterfaceAndObj.interfaceUUID;
        try {
            const createErrorRecord = await INSERT.into(errorPayload.entity, errorPayload.data);
            if (createErrorRecord.affectedRows > 0) {
                rResponse = "Error has been created.";
            }else{
                //delete interfaceData and blob from object store
                deleteInterFaceDataAndObjectStoreData(errorPayload.data.interfaceDataUUID,interFaceEntity);
            }
        } catch (error) {
            //delete interfaceData and blob from object store
            deleteInterFaceDataAndObjectStoreData(errorPayload.data.interfaceDataUUID,interFaceEntity);
            req.error(buildErrorMessages.buildErrorWithMsg(error.message));
        }
    } else {
        req.error(buildErrorMessages.buildErrorWithMsg(crtInterfaceAndObj.error));
    }
    return rResponse;
};

async function deleteInterFaceDataAndObjectStoreData(interfaceDataUUID,interFaceEntity) {
    const interFaceData = await SELECT.one.from(interFaceEntity).where`ID = ${interfaceDataUUID}`;
    if (interFaceData) {
        await DELETE.from(interFaceEntity).where`ID = ${interfaceDataUUID}`;
        if (interFaceData.objectStoreRef) {
            await objectStoreOperations.deleteRecord(interFaceData.objectStoreRef);
        }
    }
};

function formErrorData(endPoint,fields,allEntities){
    const payLoad = {};
    if(endPoint === "Nomination"){
        payLoad.entity = allEntities.NominationErrors.name;
        payLoad.entityFields = allEntities.NominationErrors.elements;
        payLoad.data = formBtpTableErrorPayload(fields);
    }else if(endPoint === "Contract"){
        payLoad.entity = allEntities.ContractErrors.name;
        payLoad.entityFields = allEntities.ContractErrors.elements;
        payLoad.data = formBtpTableErrorPayload(fields);
    }
    return payLoad;
};

function formBtpTableErrorPayload(data){
    const errorData = {};
    data.forEach(element => {
        errorData[element.keys] = element.value
    });
    return errorData;
};

function validateErrorFields(errorPayload){
    let isFieldMatch = {};
    if(errorPayload.entity){
        const entityFields = errorPayload.entityFields;
        const errorDataFields = Object.keys(errorPayload.data);
        isFieldMatch.bNoError = true;
        errorDataFields.forEach(field=>{
            if(entityFields[field]){
                // Do nothing
            }else{
                isFieldMatch.bNoError = false;
                isFieldMatch.error = field + " is not present";
            }
        });
        if(isFieldMatch.bNoError){
            isFieldMatch = validateErrorFieldsValues(errorPayload);
        }
    }else {
        isFieldMatch.bNoError = false;
        isFieldMatch.error = "Endpoint entity is not available";
    }
    return isFieldMatch;
};

function validateErrorFieldsValues(errorPayload){
    const isFieldHasValue = {};
    const entityFields = errorPayload.entityFields;
    const errorDataFields = errorPayload.data;
    const entityFieldsKeys = Object.keys(entityFields);
    //Skip validations for auto generated or internal code assigned/yet to assign fields
    const autoGendOrCodeAssindValues = ["ID","interfaceDataUUID","status_code"];
    isFieldHasValue.bNoError = true;
    entityFieldsKeys.forEach(field => {
        if (entityFields[field]) {
            const isSkipField = autoGendOrCodeAssindValues.find(autoField => autoField === entityFields[field].name);
            if(entityFields[field].hasOwnProperty("key")){
                validateValue(errorDataFields,entityFields,field,isFieldHasValue,isSkipField,true);
            }else if(entityFields[field].hasOwnProperty("notNull") && entityFields[field].type !== "cds.Association"){
                validateValue(errorDataFields,entityFields,field,isFieldHasValue,isSkipField,false);
            }
        }
    });
    return isFieldHasValue;
};

function validateValue(errorDataFields,entityFields,field,isFieldHasValue,isSkipField,_isFromKey){
    if (isSkipField) {
        //Do nothing
    } else if (errorDataFields.hasOwnProperty(entityFields[field].name)) {
        if (errorDataFields[entityFields[field].name].length < 1) {
            isFieldHasValue.bNoError = false;
            isFieldHasValue.error = `${entityFields[field].name} is required value`;
        }
    } else {
        isFieldHasValue.bNoError = false;
        isFieldHasValue.error = `${entityFields[field].name} is required value`;
    }
};

async function createInterfaceAndObjectStoreData(req,tableName,interFaceEntity) {
    let crtInterfaceAndObj = {};
    const {data} = req.data;
    let enableReprocessingValue = false;
    let isBlobRequired = false;
    if(data.enableReprocessing === "Y"){
        enableReprocessingValue = true;
        isBlobRequired = true;
    }
    if(isBlobRequired){
        //createObjectStoreBlobData
        if (data.payload) {
            const objectStoreRef = await objectStoreOperations.createRecord(data.payload);
            const interfaceData = {
                "ID": uuid.v4(),
                "sourceSystem": data.source,
                "iFlowName": data.sourceEndPoint,
                "error_errorCode": data.errorCode,
                "objectStoreRef": objectStoreRef.id,
                "httpErrorCode": data.httpErrorCode,
                "httpErrorMessage": data.httpErrorMessage,
                "techTableName": tableName,
                "enabledForReprocessing":enableReprocessingValue
            };
            if(objectStoreRef.id){
                crtInterfaceAndObj = await createInferfaceData(interfaceData,interFaceEntity,isBlobRequired,objectStoreRef.id);
            }else {
                crtInterfaceAndObj.bNoError = false;
                crtInterfaceAndObj.error = "Payload blob creation is failed with " + objectStoreRef.error;
            }
        }else {
            crtInterfaceAndObj.bNoError = false;
            crtInterfaceAndObj.error = "Payload is not available to create record in objectstore";
        }
    }else{
        //createInterfaceDataWithoutBlob
        const interfaceData = {
            "ID" : uuid.v4(),
            "sourceSystem" : data.source,
            "iFlowName" : data.sourceEndPoint,
            "error_errorCode" : data.errorCode,
            "objectStoreRef" : "",
            "httpErrorCode": data.httpErrorCode,
            "httpErrorMessage": data.httpErrorMessage,
            "techTableName" : tableName,
            "enabledForReprocessing":enableReprocessingValue
        };
        crtInterfaceAndObj = await createInferfaceData(interfaceData,interFaceEntity,isBlobRequired,"");
    }
    return crtInterfaceAndObj;
};

async function createInferfaceData(interfaceData,interFaceEntity,isBlobRequired,blobName){
    const crtInterfaceError = {};
    try {
        const createInterfaceRecord = await INSERT.into(interFaceEntity, interfaceData);
        if(createInterfaceRecord.affectedRows > 0){
            crtInterfaceError.interfaceUUID = interfaceData.ID;
            crtInterfaceError.bNoError = true;
        }
    } catch (error) {
        crtInterfaceError.bNoError = false;
        crtInterfaceError.error = error.message;
        if(isBlobRequired && blobName){
            //delete blob
            await objectStoreOperations.deleteRecord(blobName);
        }
    }
    return crtInterfaceError;
};

module.exports = {
    onCreateErrorRecord
};