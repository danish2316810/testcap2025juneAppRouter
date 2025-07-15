const { getUserRoles } = require("../../utils/userInfo");
const { validateMandatoryData } = require("../../utils/dataValidation");


async function beforeCreateInterfaceSequenceData(req){
    const data = req.data;
    const error = validateData(data);
    if (error) {
        const roles = getUserRoles(req);
        let message;
        if (req.user.is("cpi.usr") && roles.length === 1) {
            message = {};
            message.status = "Error";
            message.interfaceID = data.interfaceID;
            message.interfaceName = data.interfaceName;
            message.message = error;
        } else {
            message = error;
        }
        const rError = {
            "status": 400,
            message
        };
        req.error(rError);
    }
};

async function onCreateInterfaceSequenceData(req){
    const roles = getUserRoles(req);
    if(req.user.is("cpi.usr") && roles.length === 1){
        const data = req.data;
        try {
            const upsertResult = await UPSERT.into(req.entity).entries(data);
            if(upsertResult){
                const selectResult = await SELECT.one.from(req.entity).columns`{interfaceID,interfaceName,sequenceNumber}`.where`interfaceID = ${data.interfaceID} and interfaceName = ${data.interfaceName}`;
                req.reply(selectResult);
            }
        } catch (error) {
            const errorCode = error.code || "UNKNOWN_ERROR";
            const errorDescription = error.message || "An unknown error occurred";
            const message = {
                "status":"Error",
                "interfaceID":data.interfaceID,
                "interfaceName":data.interfaceName,
                "message":errorDescription
            };
            const rError = {
                "status":errorCode,
                message
            };
            req.error(rError);
        }
    }
};

function validateData(data){
    let error;
    const interFaceIdError = validateMandatoryData(data.interfaceID,"String","Interface ID");
    const interFaceNameError = validateMandatoryData(data.interfaceName,"String","Interface Name");
    const senderError = validateMandatoryData(data.sender,"String","Sender");
    const receiverError = validateMandatoryData(data.receiver,"String","Receiver");
    const sequenceNumberError = validateMandatoryData(data.sequenceNumber,"Integer","Sequence Number");
    if(interFaceIdError){
        error = interFaceIdError;
    } else if(interFaceNameError){
        error = interFaceNameError;
    } else if(senderError){
        error = senderError;
    } else if(receiverError){
        error = receiverError;
    } else if(sequenceNumberError){
        error = sequenceNumberError;
    }
    return error;
};

module.exports={
    beforeCreateInterfaceSequenceData,
    onCreateInterfaceSequenceData
};