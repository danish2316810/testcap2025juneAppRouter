namespace db;

entity CUSTOMERS{
    key CUSTID:Int16;
        NAME:String(80);
        GENDER:String(20);
        COUNTRY:String(100);
        CURRENCY:String(3)
}


