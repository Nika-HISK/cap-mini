using bookshop as db from '../db/schema';


service CatalogService @(path: '/catalog') {
  
  @readonly entity Books as projection on db.Books {
    *,
    categories: redirected to Categories
  } excluding { createdBy, modifiedBy };
  
  @readonly entity Categories as projection on db.Categories {
    *,
    books: redirected to BookCategories
  };
  
  @readonly entity BookCategories as projection on db.BookCategories {
    *,
    book: redirected to Books,
    category: redirected to Categories
  };
  
  @readonly entity Publishers as projection on db.Publishers {
    *,
    books: redirected to Books
  } excluding { createdBy, modifiedBy };
  
  @readonly entity Reviews as projection on db.Reviews {
    *,
    book: redirected to Books,
    user: redirected to Users
  } where isApproved = true;
  
  @readonly entity Users as projection on db.Users {
    ID, username, firstName, lastName
  };


  type BookSearchResult {
    ID: UUID;
    title: String;
    author: String;
    price: Decimal(10,2);
    averageRating: Decimal(3,2);
    totalReviews: Integer;
    coverImageUrl: String;
    categories: array of String;
  }
  
  function searchBooks(
    q: String,
    category: UUID,
    minPrice: Decimal(10,2),
    maxPrice: Decimal(10,2),
    minRating: Decimal(3,2),
    sortBy: String, // 'title', 'price', 'rating', 'date'
    sortOrder: String // 'asc', 'desc'
  ) returns array of BookSearchResult;
  

  function getRecommendations(bookId: UUID, limit: Integer) returns array of BookSearchResult;
  

  function getFeaturedBooks(limit: Integer) returns array of BookSearchResult;
  

  function getBooksByCategory(
    categoryId: UUID,
    page: Integer,
    pageSize: Integer
  ) returns {
    books: array of BookSearchResult;
    totalCount: Integer;
    totalPages: Integer;
  };
}


service UserService @(path: '/users') @(requires: 'authenticated-user') {
  
  entity Users as projection on db.Users;
  entity Addresses as projection on db.Addresses;
  entity CartItems as projection on db.CartItems;
  entity WishlistItems as projection on db.WishlistItems;
  entity Orders as projection on db.Orders;
  entity OrderItems as projection on db.OrderItems;
  entity Reviews as projection on db.Reviews;
  

  type LoginRequest {
    username: String;
    password: String;
  }
  
  type LoginResponse {
    success: Boolean;
    token: String;
    user: {
      ID: UUID;
      username: String;
      email: String;
      firstName: String;
      lastName: String;
      role: String;
    };
    message: String;
  }
  
  type RegisterRequest {
    username: String;
    email: String;
    password: String;
    firstName: String;
    lastName: String;
  }
  
  action login(request: LoginRequest) returns LoginResponse;
  action register(request: RegisterRequest) returns LoginResponse;
  action logout() returns Boolean;
  action changePassword(currentPassword: String, newPassword: String) returns Boolean;

  action addToCart(bookId: UUID, quantity: Integer) returns Boolean;
  action updateCartItem(itemId: UUID, quantity: Integer) returns Boolean;
  action removeFromCart(itemId: UUID) returns Boolean;
  action clearCart() returns Boolean;

  action addToWishlist(bookId: UUID) returns Boolean;
  action removeFromWishlist(itemId: UUID) returns Boolean;
  

  type CheckoutRequest {
    billingAddressId: UUID;
    shippingAddressId: UUID;
    paymentMethod: String;
    notes: String;
  }
  
  action checkout(request: CheckoutRequest) returns {
    success: Boolean;
    orderId: UUID;
    orderNumber: String;
    totalAmount: Decimal(10,2);
  };
  
  action cancelOrder(orderId: UUID) returns Boolean;
  

  action submitReview(
    bookId: UUID,
    rating: Integer,
    title: String,
    comment: String
  ) returns Boolean;
  
  action updateReview(
    reviewId: UUID,
    rating: Integer,
    title: String,
    comment: String
  ) returns Boolean;
  
  action deleteReview(reviewId: UUID) returns Boolean;

  function getProfile() returns Users;
  function getOrderHistory(page: Integer, pageSize: Integer) returns {
    orders: array of Orders;
    totalCount: Integer;
  };
}


service AdminService @(path: '/admin') @(requires: 'admin') {
  
  entity Books as projection on db.Books;
  entity Categories as projection on db.Categories;
  entity Publishers as projection on db.Publishers;
  entity Users as projection on db.Users;
  entity Orders as projection on db.Orders;
  entity Reviews as projection on db.Reviews;
  entity InventoryLogs as projection on db.InventoryLogs;
  entity Suppliers as projection on db.Suppliers;
  entity PurchaseOrders as projection on db.PurchaseOrders;

  action restockBook(bookId: UUID, quantity: Integer, reason: String) returns Boolean;
  action adjustInventory(bookId: UUID, newStock: Integer, reason: String) returns Boolean;
  action setReorderPoint(bookId: UUID, reorderPoint: Integer) returns Boolean;
  

  action updateOrderStatus(orderId: UUID, status: String) returns Boolean;
  action processRefund(orderId: UUID, amount: Decimal(10,2), reason: String) returns Boolean;
  

  action deactivateUser(userId: UUID) returns Boolean;
  action activateUser(userId: UUID) returns Boolean;
  action changeUserRole(userId: UUID, roleId: UUID) returns Boolean;
  

  action approveReview(reviewId: UUID) returns Boolean;
  action rejectReview(reviewId: UUID) returns Boolean;
  

  function getSalesReport(
    startDate: Date,
    endDate: Date,
    groupBy: String // 'day', 'week', 'month'
  ) returns array of {
    period: String;
    totalSales: Decimal(10,2);
    totalOrders: Integer;
    averageOrderValue: Decimal(10,2);
  };
  
  function getPopularBooks(
    startDate: Date,
    endDate: Date,
    limit: Integer
  ) returns array of {
    bookId: UUID;
    title: String;
    author: String;
    totalSold: Integer;
    revenue: Decimal(10,2);
  };
  
  function getInventoryReport() returns array of {
    bookId: UUID;
    title: String;
    currentStock: Integer;
    reorderPoint: Integer;
    needsReorder: Boolean;
    totalSales: Integer;
  };
  
  function getUserActivityReport(
    startDate: Date,
    endDate: Date
  ) returns {
    totalUsers: Integer;
    newUsers: Integer;
    activeUsers: Integer;
    topCustomers: array of {
      userId: UUID;
      username: String;
      totalOrders: Integer;
      totalSpent: Decimal(10,2);
    };
  };
}

service NotificationService @(path: '/notifications') {
  

  action sendLowStockAlert(bookId: UUID) returns Boolean;

  action sendOrderConfirmation(orderId: UUID) returns Boolean;
  action sendShippingNotification(orderId: UUID) returns Boolean;
  action sendDeliveryNotification(orderId: UUID) returns Boolean;
  

  action sendWelcomeEmail(userId: UUID) returns Boolean;
  action sendPasswordResetEmail(email: String) returns Boolean;
}
