namespace cdsv;


using { asso.ListReportCustomer } from './asso';
entity CustomerView as select from ListReportCustomer {
       key ID,
        CustomerName,
        City,        
        country_code,
        country.name
}
        
