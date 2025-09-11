using { 
  managed, 
  cuid, 
  Country, 
  Currency,
  temporal
} from '@sap/cds/common';

namespace bookshop;

// User Management
entity Users : managed {
  key ID       : UUID;
  username     : String(50) @mandatory;
  email        : String(100) @mandatory;
  passwordHash : String(255) @mandatory;
  firstName    : String(50);
  lastName     : String(50);
  phone        : String(20);
  role         : Association to Roles;
  isActive     : Boolean default true;
  lastLogin    : Timestamp;
  address      : Composition of many Addresses on address.user = $self;
  orders       : Composition of many Orders on orders.customer = $self;
  reviews      : Composition of many Reviews on reviews.user = $self;
  cart         : Composition of many CartItems on cart.user = $self;
}

entity Roles : managed {
  key ID   : UUID;
  name     : String(30) @mandatory; // 'Customer', 'Admin', 'Manager'
  description : String(100);
  permissions : Composition of many RolePermissions on permissions.role = $self;
}

entity Permissions : managed {
  key ID   : UUID;
  name     : String(50) @mandatory;
  description : String(100);
  resource : String(50); // 'Books', 'Orders', 'Users'
  action   : String(20); // 'READ', 'WRITE', 'DELETE', 'ADMIN'
}

entity RolePermissions : managed {
  key ID : UUID;
  role   : Association to Roles;
  permission : Association to Permissions;
}

entity Addresses : managed {
  key ID      : UUID;
  user        : Association to Users;
  type        : String(20); // 'billing', 'shipping'
  street      : String(100);
  city        : String(50);
  state       : String(50);
  postalCode  : String(20);
  country     : Country;
  isDefault   : Boolean default false;
}

// Enhanced Books
entity Categories : managed {
  key ID          : UUID;
  name            : String(50) @mandatory;
  description     : String(200);
  parentCategory  : Association to Categories;
  subcategories   : Composition of many Categories on subcategories.parentCategory = $self;
  books           : Association to many BookCategories on books.category = $self;
}

entity Publishers : managed {
  key ID      : UUID;
  name        : String(100) @mandatory;
  address     : String(200);
  website     : String(100);
  contactEmail: String(100);
  books       : Composition of many Books on books.publisher = $self;
}

entity Books : managed {
  key ID          : UUID;
  title           : String(200) @mandatory;
  author          : String(100) @mandatory;
  isbn            : String(17); // ISBN-13 format
  description     : String(1000);
  publisher       : Association to Publishers;
  publishedDate   : Date;
  stock           : Integer default 0;
  price           : Decimal(10,2) @mandatory;
  originalPrice   : Decimal(10,2);
  currency        : Currency default 'USD';
  pages           : Integer;
  language        : String(10) default 'en';
  format          : String(20); // 'hardcover', 'paperback', 'ebook', 'audiobook'
  weight          : Decimal(5,2); // in kg
  dimensions      : String(50); // "L x W x H cm"
  coverImageUrl   : String(500);
  isActive        : Boolean default true;
  isFeatured      : Boolean default false;
  averageRating   : Decimal(3,2) default 0.00;
  totalReviews    : Integer default 0;
  totalSales      : Integer default 0;
  reorderPoint    : Integer default 5; // Minimum stock before reorder
  maxStock        : Integer default 100;
  
  categories      : Association to many BookCategories on categories.book = $self;
  reviews         : Composition of many Reviews on reviews.book = $self;
  orderItems      : Association to many OrderItems on orderItems.book = $self;
  inventoryLogs   : Composition of many InventoryLogs on inventoryLogs.book = $self;
  wishlistItems   : Association to many WishlistItems on wishlistItems.book = $self;
}

entity BookCategories : managed {
  key ID       : UUID;
  book         : Association to Books;
  category     : Association to Categories;
}

entity Reviews : managed {
  key ID       : UUID;
  book         : Association to Books @mandatory;
  user         : Association to Users @mandatory;
  rating       : Integer @mandatory @assert.range: [1, 5];
  title        : String(100);
  comment      : String(1000);
  isVerifiedPurchase : Boolean default false;
  helpfulVotes : Integer default 0;
  isApproved   : Boolean default false;
}

// Shopping & Orders
entity CartItems : managed {
  key ID       : UUID;
  user         : Association to Users @mandatory;
  book         : Association to Books @mandatory;
  quantity     : Integer @mandatory @assert.range: [1, 50];
  addedAt      : Timestamp default NOW();
}

entity WishlistItems : managed {
  key ID       : UUID;
  user         : Association to Users @mandatory;
  book         : Association to Books @mandatory;
  addedAt      : Timestamp default NOW();
}

entity Orders : managed {
  key ID           : UUID;
  orderNumber      : String(20) @mandatory;
  customer         : Association to Users @mandatory;
  status           : String(20) default 'pending'; // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  orderDate        : Timestamp default NOW();
  shippedDate      : Timestamp;
  deliveredDate    : Timestamp;
  subtotal         : Decimal(10,2) @mandatory;
  tax              : Decimal(10,2) default 0.00;
  shippingCost     : Decimal(10,2) default 0.00;
  discount         : Decimal(10,2) default 0.00;
  totalAmount      : Decimal(10,2) @mandatory;
  currency         : Currency default 'USD';
  
  billingAddress   : Association to Addresses;
  shippingAddress  : Association to Addresses;
  items            : Composition of many OrderItems on items.order = $self;
  payments         : Composition of many Payments on payments.order = $self;
  trackingNumber   : String(100);
  notes            : String(500);
}

entity OrderItems : managed {
  key ID       : UUID;
  order        : Association to Orders @mandatory;
  book         : Association to Books @mandatory;
  quantity     : Integer @mandatory;
  unitPrice    : Decimal(10,2) @mandatory;
  totalPrice   : Decimal(10,2) @mandatory;
  currency     : Currency default 'USD';
}

entity Payments : managed {
  key ID           : UUID;
  order            : Association to Orders @mandatory;
  paymentMethod    : String(20); // 'credit_card', 'paypal', 'bank_transfer'
  paymentStatus    : String(20) default 'pending'; // 'pending', 'completed', 'failed', 'refunded'
  amount           : Decimal(10,2) @mandatory;
  currency         : Currency default 'USD';
  transactionId    : String(100);
  paymentDate      : Timestamp;
  gatewayResponse  : String(500);
}

// Inventory Management
entity InventoryLogs : managed {
  key ID           : UUID;
  book             : Association to Books @mandatory;
  transactionType  : String(20) @mandatory; // 'purchase', 'sale', 'adjustment', 'return'
  quantityChange   : Integer @mandatory; // positive for increase, negative for decrease
  previousStock    : Integer @mandatory;
  newStock         : Integer @mandatory;
  reason           : String(100);
  referenceId      : String(100); // Order ID, Purchase Order ID, etc.
  performedBy      : Association to Users;
}

entity Suppliers : managed {
  key ID           : UUID;
  name             : String(100) @mandatory;
  contactPerson    : String(100);
  email            : String(100);
  phone            : String(20);
  address          : String(200);
  website          : String(100);
  paymentTerms     : String(50);
  isActive         : Boolean default true;
  
  purchaseOrders   : Composition of many PurchaseOrders on purchaseOrders.supplier = $self;
}

entity PurchaseOrders : managed {
  key ID           : UUID;
  orderNumber      : String(20) @mandatory;
  supplier         : Association to Suppliers @mandatory;
  status           : String(20) default 'pending'; // 'pending', 'sent', 'received', 'cancelled'
  orderDate        : Timestamp default NOW();
  expectedDate     : Date;
  receivedDate     : Timestamp;
  totalAmount      : Decimal(10,2);
  currency         : Currency default 'USD';
  
  items            : Composition of many PurchaseOrderItems on items.purchaseOrder = $self;
  notes            : String(500);
}

entity PurchaseOrderItems : managed {
  key ID           : UUID;
  purchaseOrder    : Association to PurchaseOrders @mandatory;
  book             : Association to Books @mandatory;
  quantityOrdered  : Integer @mandatory;
  quantityReceived : Integer default 0;
  unitCost         : Decimal(10,2) @mandatory;
  totalCost        : Decimal(10,2) @mandatory;
}