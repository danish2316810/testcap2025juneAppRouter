using {db} from '../db/test';
using { asso.ListReportCustomer } from '../db/asso';
using { asp.Country } from '../db/reusableAspects';

@path: 'MY'
service MYSERVICE {

    entity CUST as projection on db.CUSTOMERS;
    entity Customers as projection on ListReportCustomer;
  entity Countries as projection on Country;

}
