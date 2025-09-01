using { managed } from '@sap/cds/common';

namespace my.bookshop;

entity Books : managed {
  key ID    : UUID;
  title     : String(111);
  author    : String(111);
  stock     : Integer;
  price     : Decimal(9,2);
}