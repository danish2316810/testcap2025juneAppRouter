using {db} from '../db/test';


service MyService {

    entity CUST as projection on db.CUSTOMERS;

}
