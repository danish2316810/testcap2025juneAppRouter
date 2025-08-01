using { db } from '../db/interfaceData';

@path: 'interfaceService'
service MYSERVICE2 {
entity interfaceData as projection on db.interfaceData;
entity ErrorCodes as projection on db.ErrorCodes;
}