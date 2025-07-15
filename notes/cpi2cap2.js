const cds = require("@sap/cds");
const LOG = cds.log('getEntityData');


async function _entityData(req) {
    const { data } = req.data;
    LOG.debug('Request Data:', data);
    const constructedEntityName = `${data.serviceName}_${data.entityName}`;
    LOG.debug('Constructed Entity : ', constructedEntityName);
    if (!constructedEntityName) {
        return req.reply("Entity name is required");
    }

    const entity = cds.entities("opex.ds.usib.db")[data.entityName.split(".").pop()];
    LOG.debug(entity.elements);
    if (!entity) {
        return req.reply("Entity not found");
    }

    const entityData = await cds.run(SELECT.from(entity));
    return _insertData(entityData, entity, req);
};


function _insertData(entityData, entity, req) {
    if (entityData.length === 0) {
        return req.reply("No data found for the selected entity");
    }

    const keyFields = [];
    let columns = [];
    const colsEnd = [];

    Object.keys(entity.elements).forEach(key => {
        const element = entity.elements[key];
        if (entity.elements[key].type !== "cds.Association") {
            const label = element['@Common.Label'] || element['@title'] || key;
            if (element.key) {
                keyFields.push(key);
            }
            const column = { name: key, label };

            if (['createdAt', 'createdBy', 'modifiedAt', 'modifiedBy'].includes(key)) {
                colsEnd.push(column);
            } else {
                columns.push(column);
            }
        }
    });

    columns = columns.concat(colsEnd);

    const result = entityData.map(record => {
        const transformedRecord = {};
        Object.keys(record).forEach(key => {
            transformedRecord[key] = record[key];
        });

        return transformedRecord;
    });

    LOG.debug("Entity Columns:", columns);
    LOG.debug("Key Fields:", keyFields);

    return {
        "EntityData": result,
        "EntityColumns": columns,
        "KeyFields": keyFields
    };

    
};


cds.on('getEntityData', _entityData);
module.exports = _entityData