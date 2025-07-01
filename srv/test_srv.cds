using {db} from '../db/test';

@path: 'MY'
service MYSERVICE {

    entity CUST as projection on db.CUSTOMERS;

}
