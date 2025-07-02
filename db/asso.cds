namespace asso;

using { cuid } from '@sap/cds/common';
using { asp } from './reusableAspects';

entity ListReportCustomer : cuid, asp.WithCountry {
  CustomerName : String(200);
  City         : String(100);
}
