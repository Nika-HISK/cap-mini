const cds = require('@sap/cds');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = cds.service.impl(async function () {
  const { 
    Users, Roles, CartItems, WishlistItems, Orders, OrderItems, 
    Reviews, Books, Addresses, Payments 
  } = this.entities;


  this.before('*', async (req) => {

    if (['login', 'register'].includes(req.event)) return;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return req.reject(401, 'Authentication required');
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      req.user = decoded;

      const user = await cds.run(
        cds.SELECT.one.from(Users)
          .columns('ID', 'username', 'isActive', 'role_ID')
          .where({ ID: decoded.userId, isActive: true })
      );
      
      if (!user) {
        return req.reject(401, 'Invalid or expired token');
      }
      
      req.user.dbUser = user;
    } catch (error) {
      return req.reject(401, 'Invalid token');
    }
  });


  this.on('register', async (req) => {
    const { username, email, password, firstName, lastName } = req.data.request;

    if (!username || !email || !password) {
      return {
        success: false,
        message: 'Username, email, and password are required'
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    try {

      const existingUser = await cds.run(
        cds.SELECT.one.from(Users)
          .where({ or: [{ username }, { email }] })
      );

      if (existingUser) {
        return {
          success: false,
          message: 'Username or email already exists'
        };
      }


      let customerRole = await cds.run(
        cds.SELECT.one.from(Roles).where({ name: 'Customer' })
      );

      if (!customerRole) {
        customerRole = await cds.run(
          cds.INSERT.into(Roles).entries({
            ID: uuidv4(),
            name: 'Customer',
            description: 'Regular customer'
          })
        );
        customerRole = { ID: customerRole.ID };
      }


      const passwordHash = await bcrypt.hash(password, 10);


      const userId = uuidv4();
      await cds.run(
        cds.INSERT.into(Users).entries({
          ID: userId,
          username,
          email,
          passwordHash,
          firstName: firstName || '',
          lastName: lastName || '',
          role_ID: customerRole.ID,
          isActive: true
        })
      );

      const token = jwt.sign(
        { userId, username, role: 'Customer' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        success: true,
        token,
        user: {
          ID: userId,
          username,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          role: 'Customer'
        },
        message: 'Registration successful'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  });

  this.on('login', async (req) => {
    const { username, password } = req.data.request;

    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required'
      };
    }

    try {
      const user = await cds.run(
        cds.SELECT.one.from(Users)
          .columns(u => {
            u.ID, u.username, u.email, u.passwordHash, 
            u.firstName, u.lastName, u.isActive,
            u.role(r => { r.name })
          })
          .where({ 
            or: [{ username }, { email: username }],
            isActive: true 
          })
      );

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      await cds.run(
        cds.UPDATE(Users)
          .set({ lastLogin: new Date() })
          .where({ ID: user.ID })
      );

      const token = jwt.sign(
        { 
          userId: user.ID, 
          username: user.username, 
          role: user.role?.name || 'Customer' 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        success: true,
        token,
        user: {
          ID: user.ID,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role?.name || 'Customer'
        },
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  });

  this.on('addToCart', async (req) => {
    const { bookId, quantity = 1 } = req.data;
    const userId = req.user.userId;

    try {
      const book = await cds.run(
        cds.SELECT.one.from(Books)
          .columns('ID', 'title', 'stock', 'isActive')
          .where({ ID: bookId, isActive: true })
      );

      if (!book) {
        return req.error(404, 'Book not found');
      }

      if (book.stock < quantity) {
        return req.error(400, `Only ${book.stock} items available in stock`);
      }

      // Check if item already in cart
      const existingItem = await cds.run(
        cds.SELECT.one.from(CartItems)
          .where({ user_ID: userId, book_ID: bookId })
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > book.stock) {
          return req.error(400, `Cannot add more items. Only ${book.stock} available.`);
        }

        await cds.run(
          cds.UPDATE(CartItems)
            .set({ quantity: newQuantity })
            .where({ ID: existingItem.ID })
        );
      } else {
        await cds.run(
          cds.INSERT.into(CartItems).entries({
            ID: uuidv4(),
            user_ID: userId,
            book_ID: bookId,
            quantity
          })
        );
      }

      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      return req.error(500, 'Failed to add item to cart');
    }
  });

  this.on('checkout', async (req) => {
    const { billingAddressId, shippingAddressId, paymentMethod, notes } = req.data.request;
    const userId = req.user.userId;

    try {
      // Start transaction
      const tx = cds.transaction(req);

      // Get cart items
      const cartItems = await tx.run(
        cds.SELECT.from(CartItems)
          .columns(ci => {
            ci.ID, ci.quantity,
            ci.book(b => { b.ID, b.title, b.price, b.stock })
          })
          .where({ user_ID: userId })
      );

      if (cartItems.length === 0) {
        return req.error(400, 'Cart is empty');
      }

      // Validate stock and calculate total
      let subtotal = 0;
      for (const item of cartItems) {
        if (item.book.stock < item.quantity) {
          return req.error(400, `Insufficient stock for ${item.book.title}`);
        }
        subtotal += item.book.price * item.quantity;
      }

      // Calculate tax and shipping (simplified)
      const taxRate = 0.08; // 8% tax
      const tax = subtotal * taxRate;
      const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
      const totalAmount = subtotal + tax + shippingCost;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create order
      const orderId = uuidv4();
      await tx.run(
        cds.INSERT.into(Orders).entries({
          ID: orderId,
          orderNumber,
          customer_ID: userId,
          status: 'pending',
          subtotal,
          tax,
          shippingCost,
          totalAmount,
          billingAddress_ID: billingAddressId,
          shippingAddress_ID: shippingAddressId,
          notes: notes || ''
        })
      );

      // Create order items and update book stock
      for (const item of cartItems) {
        // Create order item
        await tx.run(
          cds.INSERT.into(OrderItems).entries({
            ID: uuidv4(),
            order_ID: orderId,
            book_ID: item.book.ID,
            quantity: item.quantity,
            unitPrice: item.book.price,
            totalPrice: item.book.price * item.quantity
          })
        );

        // Update book stock
        await tx.run(
          cds.UPDATE(Books)
            .set({ stock: item.book.stock - item.quantity })
            .where({ ID: item.book.ID })
        );
      }

      // Create payment record
      await tx.run(
        cds.INSERT.into(Payments).entries({
          ID: uuidv4(),
          order_ID: orderId,
          paymentMethod,
          paymentStatus: 'pending',
          amount: totalAmount
        })
      );

      // Clear cart
      await tx.run(
        cds.DELETE.from(CartItems).where({ user_ID: userId })
      );

      await tx.commit();

      return {
        success: true,
        orderId,
        orderNumber,
        totalAmount
      };

    } catch (error) {
      console.error('Checkout error:', error);
      return req.error(500, 'Checkout failed');
    }
  });

  // Submit review
  this.on('submitReview', async (req) => {
    const { bookId, rating, title, comment } = req.data;
    const userId = req.user.userId;

    try {
      // Check if user has purchased this book
      const hasOrdered = await cds.run(
        cds.SELECT.one
          .from(OrderItems, 'oi')
          .columns('oi.ID')
          .join(Orders, 'o').on('o.ID = oi.order_ID')
          .where({
            'o.customer_ID': userId,
            'oi.book_ID': bookId,
            'o.status': { in: ['delivered', 'completed'] }
          })
      );

      // Check if user already reviewed this book
      const existingReview = await cds.run(
        cds.SELECT.one.from(Reviews)
          .where({ user_ID: userId, book_ID: bookId })
      );

      if (existingReview) {
        return req.error(400, 'You have already reviewed this book');
      }

      // Create review
      await cds.run(
        cds.INSERT.into(Reviews).entries({
          ID: uuidv4(),
          book_ID: bookId,
          user_ID: userId,
          rating,
          title: title || '',
          comment: comment || '',
          isVerifiedPurchase: !!hasOrdered,
          isApproved: false // Requires admin approval
        })
      );

      // Update book average rating
      await this.updateBookRating(bookId);

      return true;
    } catch (error) {
      console.error('Submit review error:', error);
      return req.error(500, 'Failed to submit review');
    }
  });

  // Helper function to update book average rating
  this.updateBookRating = async (bookId) => {
    const stats = await cds.run(
      cds.SELECT.from(Reviews)
        .columns('AVG(rating) as avgRating', 'COUNT(*) as totalReviews')
        .where({ book_ID: bookId, isApproved: true })
    );

    if (stats.length > 0) {
      await cds.run(
        cds.UPDATE(Books)
          .set({
            averageRating: Math.round(stats[0].avgRating * 100) / 100,
            totalReviews: stats[0].totalReviews
          })
          .where({ ID: bookId })
      );
    }
  };

  // Secure user data access
  this.before(['READ', 'EDIT'], 'Users', (req) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Users can only access their own data, unless they're admin
    if (userRole !== 'Admin') {
      req.query.where({ ID: userId });
    }
  });

  // Secure cart access
  this.before(['READ', 'EDIT'], 'CartItems', (req) => {
    req.query.where({ user_ID: req.user.userId });
  });

  // Secure wishlist access
  this.before(['READ', 'EDIT'], 'WishlistItems', (req) => {
    req.query.where({ user_ID: req.user.userId });
  });

  // Secure orders access
  this.before(['READ'], 'Orders', (req) => {
    if (req.user.role !== 'Admin') {
      req.query.where({ customer_ID: req.user.userId });
    }
  });
});
