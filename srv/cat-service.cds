using my.bookshop as my from '../db/schema';

service CatalogService @(path:'catalog') {
  entity Books as projection on my.Books;

  // Action: restock a book -> return Boolean (success/failure)
  action restock (ID: UUID, amount: Integer) returns Boolean;

  // Function: searchBooks -> return a list of simple structs
  type BookResult {
    ID    : UUID;
    title : String;
    author: String;
    stock : Integer;
    price : Decimal(9,2);
  }
  function searchBooks (q: String) returns many BookResult;
}
