const cds = require('@sap/cds');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  console.log('Seeding database with sample data...\n');
  
  try {
    await cds.connect();
    const db = await cds.connect.to('db');
    

    console.log('Cleaning existing data...');
    await db.run('DELETE FROM bookshop_Reviews');
    await db.run('DELETE FROM bookshop_CartItems');
    await db.run('DELETE FROM bookshop_WishlistItems');
    await db.run('DELETE FROM bookshop_OrderItems');
    await db.run('DELETE FROM bookshop_Orders');
    await db.run('DELETE FROM bookshop_BookCategories');
    await db.run('DELETE FROM bookshop_Books');
    await db.run('DELETE FROM bookshop_Categories');
    await db.run('DELETE FROM bookshop_Publishers');
    await db.run('DELETE FROM bookshop_Addresses');
    await db.run('DELETE FROM bookshop_RolePermissions');
    await db.run('DELETE FROM bookshop_Permissions');
    await db.run('DELETE FROM bookshop_Users');
    await db.run('DELETE FROM bookshop_Roles');


    console.log('Creating roles...');
    const adminRoleId = uuidv4();
    const managerRoleId = uuidv4();
    const customerRoleId = uuidv4();

    await db.run(cds.INSERT.into('bookshop.Roles').entries([
      {
        ID: adminRoleId,
        name: 'Admin',
        description: 'System administrator with full access'
      },
      {
        ID: managerRoleId,
        name: 'Manager',
        description: 'Store manager with inventory and order management'
      },
      {
        ID: customerRoleId,
        name: 'Customer',
        description: 'Regular customer'
      }
    ]));


    console.log('Creating permissions...');
    const permissions = [
      { name: 'READ_BOOKS', description: 'Read books', resource: 'Books', action: 'READ' },
      { name: 'WRITE_BOOKS', description: 'Create/Update books', resource: 'Books', action: 'WRITE' },
      { name: 'DELETE_BOOKS', description: 'Delete books', resource: 'Books', action: 'DELETE' },
      { name: 'MANAGE_ORDERS', description: 'Manage orders', resource: 'Orders', action: 'ADMIN' },
      { name: 'MANAGE_USERS', description: 'Manage users', resource: 'Users', action: 'ADMIN' },
      { name: 'VIEW_REPORTS', description: 'View analytics reports', resource: 'Reports', action: 'READ' }
    ];

    const permissionIds = {};
    for (const perm of permissions) {
      const id = uuidv4();
      permissionIds[perm.name] = id;
      await db.run(cds.INSERT.into('bookshop.Permissions').entries({
        ID: id,
        ...perm
      }));
    }

    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    const adminUserId = uuidv4();
    const managerUserId = uuidv4();
    const customerUserId = uuidv4();

    await db.run(cds.INSERT.into('bookshop.Users').entries([
      {
        ID: adminUserId,
        username: 'admin',
        email: 'admin@bookshop.com',
        passwordHash: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role_ID: adminRoleId,
        isActive: true
      },
      {
        ID: managerUserId,
        username: 'manager',
        email: 'manager@bookshop.com',
        passwordHash: managerPassword,
        firstName: 'Store',
        lastName: 'Manager',
        role_ID: managerRoleId,
        isActive: true
      },
      {
        ID: customerUserId,
        username: 'customer',
        email: 'customer@bookshop.com',
        passwordHash: customerPassword,
        firstName: 'John',
        lastName: 'Doe',
        role_ID: customerRoleId,
        isActive: true
      }
    ]));

    console.log('Creating categories...');
    const categories = [
      { name: 'Programming', description: 'Programming and software development books' },
      { name: 'Web Development', description: 'Frontend and backend web development' },
      { name: 'Data Science', description: 'Data analysis, machine learning, and AI' },
      { name: 'DevOps', description: 'DevOps, CI/CD, and infrastructure' },
      { name: 'Mobile Development', description: 'Mobile app development for iOS and Android' },
      { name: 'Software Architecture', description: 'System design and software architecture' },
      { name: 'Databases', description: 'Database design and management' },
      { name: 'Security', description: 'Cybersecurity and secure coding practices' }
    ];

    const categoryIds = {};
    for (const category of categories) {
      const id = uuidv4();
      categoryIds[category.name] = id;
      await db.run(cds.INSERT.into('bookshop.Categories').entries({
        ID: id,
        ...category
      }));
    }

    console.log('Creating publishers...');
    const publishers = [
      { 
        name: 'O\'Reilly Media', 
        address: '1005 Gravenstein Highway North, Sebastopol, CA 95472',
        website: 'https://www.oreilly.com',
        contactEmail: 'contact@oreilly.com'
      },
      { 
        name: 'Manning Publications', 
        address: '20 Baldwin Road, PO Box 761, Shelter Island, NY 11964',
        website: 'https://www.manning.com',
        contactEmail: 'support@manning.com'
      },
      { 
        name: 'Pragmatic Bookshelf', 
        address: 'Dallas, TX',
        website: 'https://pragprog.com',
        contactEmail: 'support@pragprog.com'
      },
      { 
        name: 'Addison-Wesley', 
        address: 'Boston, MA',
        website: 'https://www.pearson.com',
        contactEmail: 'contact@pearson.com'
      },
      { 
        name: 'Packt Publishing', 
        address: 'Livery Place, 35 Livery Street, Birmingham B3 2PB, UK',
        website: 'https://www.packtpub.com',
        contactEmail: 'support@packtpub.com'
      }
    ];

    const publisherIds = {};
    for (const publisher of publishers) {
      const id = uuidv4();
      publisherIds[publisher.name] = id;
      await db.run(cds.INSERT.into('bookshop.Publishers').entries({
        ID: id,
        ...publisher
      }));
    }

    console.log('Creating books...');
    const books = [
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
        publisher: publisherIds['Addison-Wesley'],
        publishedDate: '2008-08-01',
        stock: 25,
        price: 39.99,
        originalPrice: 44.99,
        pages: 464,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/clean-code.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Software Architecture']
      },
      {
        title: 'The Pragmatic Programmer: Your Journey To Mastery',
        author: 'David Thomas, Andrew Hunt',
        isbn: '978-0135957059',
        description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again.',
        publisher: publisherIds['Addison-Wesley'],
        publishedDate: '2019-09-13',
        stock: 30,
        price: 42.50,
        originalPrice: 47.99,
        pages: 352,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/pragmatic-programmer.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Software Architecture']
      },
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        isbn: '978-0201633610',
        description: 'Capturing a wealth of experience about the design of object-oriented software.',
        publisher: publisherIds['Addison-Wesley'],
        publishedDate: '1994-10-31',
        stock: 18,
        price: 54.99,
        originalPrice: 59.99,
        pages: 395,
        format: 'hardcover',
        coverImageUrl: 'https://images.example.com/design-patterns.jpg',
        isActive: true,
        isFeatured: false,
        categories: ['Programming', 'Software Architecture']
      },
      {
        title: 'JavaScript: The Definitive Guide',
        author: 'David Flanagan',
        isbn: '978-1491952023',
        description: 'Master the world\'s most-used programming language with this comprehensive guide.',
        publisher: publisherIds['O\'Reilly Media'],
        publishedDate: '2017-05-14',
        stock: 22,
        price: 49.99,
        originalPrice: 54.99,
        pages: 688,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/js-definitive.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Web Development']
      },
      {
        title: 'You Don\'t Know JS: Scope & Closures',
        author: 'Kyle Simpson',
        isbn: '978-1449335588',
        description: 'No matter how much experience you have with JavaScript, odds are you don\'t fully understand it.',
        publisher: publisherIds['O\'Reilly Media'],
        publishedDate: '2014-03-24',
        stock: 35,
        price: 29.95,
        originalPrice: 34.95,
        pages: 98,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/ydkjs-scope.jpg',
        isActive: true,
        isFeatured: false,
        categories: ['Programming', 'Web Development']
      },
      {
        title: 'Effective Java',
        author: 'Joshua Bloch',
        isbn: '978-0134685991',
        description: 'The definitive guide to Java platform best practices–updated for Java 7, 8, and 9.',
        publisher: publisherIds['Addison-Wesley'],
        publishedDate: '2017-12-27',
        stock: 20,
        price: 48.99,
        originalPrice: 54.99,
        pages: 412,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/effective-java.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming']
      },
      {
        title: 'Spring Boot in Action',
        author: 'Craig Walls',
        isbn: '978-1617292545',
        description: 'Spring Boot in Action is a developer-focused guide to writing applications using Spring Boot.',
        publisher: publisherIds['Manning Publications'],
        publishedDate: '2015-12-27',
        stock: 15,
        price: 44.99,
        originalPrice: 49.99,
        pages: 264,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/spring-boot.jpg',
        isActive: true,
        isFeatured: false,
        categories: ['Programming', 'Web Development']
      },
      {
        title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
        author: 'Eric Evans',
        isbn: '978-0321125217',
        description: 'Connecting business and programming to improve effectiveness.',
        publisher: publisherIds['Addison-Wesley'],
        publishedDate: '2003-08-30',
        stock: 12,
        price: 49.50,
        originalPrice: 54.99,
        pages: 560,
        format: 'hardcover',
        coverImageUrl: 'https://images.example.com/ddd.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Software Architecture']
      },
      {
        title: 'Python Crash Course: A Hands-On, Project-Based Introduction',
        author: 'Eric Matthes',
        isbn: '978-1593279288',
        description: 'Python Crash Course is a fast-paced, thorough introduction to Python.',
        publisher: publisherIds['O\'Reilly Media'],
        publishedDate: '2019-05-03',
        stock: 28,
        price: 34.95,
        originalPrice: 39.95,
        pages: 544,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/python-crash.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Data Science']
      },
      {
        title: 'Learning React: Modern Patterns for Developing React Apps',
        author: 'Alex Banks, Eve Porcello',
        isbn: '978-1492051718',
        description: 'If you want to learn how to build efficient React applications, this is your book.',
        publisher: publisherIds['O\'Reilly Media'],
        publishedDate: '2020-06-12',
        stock: 32,
        price: 44.99,
        originalPrice: 49.99,
        pages: 310,
        format: 'paperback',
        coverImageUrl: 'https://images.example.com/learning-react.jpg',
        isActive: true,
        isFeatured: true,
        categories: ['Programming', 'Web Development']
      }
    ];

    const bookIds = {};
    for (const book of books) {
      const id = uuidv4();
      bookIds[book.title] = id;
      
      const { categories, ...bookData } = book;
      await db.run(cds.INSERT.into('bookshop.Books').entries({
        ID: id,
        ...bookData
      }));

      for (const categoryName of categories) {
        const categoryId = categoryIds[categoryName];
        if (categoryId) {
          await db.run(cds.INSERT.into('bookshop.BookCategories').entries({
            ID: uuidv4(),
            book_ID: id,
            category_ID: categoryId
          }));
        }
      }
    }


    console.log('Creating sample addresses...');
    const customerAddressId = uuidv4();
    await db.run(cds.INSERT.into('bookshop.Addresses').entries({
      ID: customerAddressId,
      user_ID: customerUserId,
      type: 'shipping',
      street: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country_code: 'US',
      isDefault: true
    }));

    console.log('Creating sample reviews...');
    const reviewsData = [
      {
        book: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        rating: 5,
        title: 'Essential reading for developers',
        comment: 'This book completely changed how I write code. Every developer should read it.',
        isApproved: true
      },
      {
        book: 'The Pragmatic Programmer: Your Journey To Mastery',
        rating: 5,
        title: 'Timeless wisdom',
        comment: 'Still relevant after all these years. Great practical advice.',
        isApproved: true
      },
      {
        book: 'JavaScript: The Definitive Guide',
        rating: 4,
        title: 'Comprehensive but dense',
        comment: 'Very thorough coverage of JavaScript, but can be overwhelming for beginners.',
        isApproved: true
      }
    ];

    for (const review of reviewsData) {
      const bookId = bookIds[review.book];
      if (bookId) {
        await db.run(cds.INSERT.into('bookshop.Reviews').entries({
          ID: uuidv4(),
          book_ID: bookId,
          user_ID: customerUserId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          isVerifiedPurchase: true,
          isApproved: review.isApproved
        }));
      }
    }

    console.log('Updating book ratings...');
    for (const [bookTitle, bookId] of Object.entries(bookIds)) {
      const stats = await db.run(
        cds.SELECT.from('bookshop.Reviews')
          .columns('AVG(rating) as avgRating', 'COUNT(*) as totalReviews')
          .where({ book_ID: bookId, isApproved: true })
      );

      if (stats.length > 0 && stats[0].totalReviews > 0) {
        await db.run(
          cds.UPDATE('bookshop.Books')
            .set({
              averageRating: Math.round(stats[0].avgRating * 100) / 100,
              totalReviews: stats[0].totalReviews
            })
            .where({ ID: bookId })
        );
      }
    }

    console.log('Adding items to customer cart...');
    await db.run(cds.INSERT.into('bookshop.CartItems').entries([
      {
        ID: uuidv4(),
        user_ID: customerUserId,
        book_ID: bookIds['Clean Code: A Handbook of Agile Software Craftsmanship'],
        quantity: 1
      },
      {
        ID: uuidv4(),
        user_ID: customerUserId,
        book_ID: bookIds['JavaScript: The Definitive Guide'],
        quantity: 2
      }
    ]));

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample Users Created:');
    console.log('👤 Admin: username="admin", password="admin123"');
    console.log('👤 Manager: username="manager", password="manager123"');
    console.log('👤 Customer: username="customer", password="customer123"');
    console.log('\nSample Data:');
    console.log(`📚 ${books.length} books across ${categories.length} categories`);
    console.log(`🏢 ${publishers.length} publishers`);
    console.log(`⭐ ${reviewsData.length} sample reviews`);
    console.log(`🛒 Sample cart items for customer`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await cds.disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
