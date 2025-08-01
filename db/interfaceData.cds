namespace db;
using {cuid} from '@sap/cds/common';

entity interfaceData : cuid {
    sourceSystem: String(7);
       fCode:String(5);
       error: Association to ErrorCodes on error.errorCode=fCode;
}

entity ErrorCodes{
    key errorCode:String(4);
         message:String(200);
}
