const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Books, Categories, Reviews, BookCategories } = this.entities;

  this.on('searchBooks', async (req) => {
    const { q, category, minPrice, maxPrice, minRating, sortBy = 'title', sortOrder = 'asc' } = req.data;
    
    let query = cds.SELECT.from(Books)
      .columns(b => {
        b.ID, b.title, b.author, b.price, b.averageRating, 
        b.totalReviews, b.coverImageUrl, b.stock, b.isActive
      })
      .where({ isActive: true });

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      query = query.and({
        or: [
          { title: { like: searchTerm } },
          { author: { like: searchTerm } },
          { description: { like: searchTerm } }
        ]
      });
    }

    if (category) {
      const bookIds = await cds.run(
        cds.SELECT.from(BookCategories)
          .columns('book_ID')
          .where({ category_ID: category })
      );
      if (bookIds.length > 0) {
        query = query.and({ ID: { in: bookIds.map(item => item.book_ID) } });
      }
    }

    if (minPrice !== undefined) query = query.and({ price: { '>=': minPrice } });
    if (maxPrice !== undefined) query = query.and({ price: { '<=': maxPrice } });


    if (minRating !== undefined) query = query.and({ averageRating: { '>=': minRating } });


    const validSortFields = ['title', 'price', 'averageRating', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'title';
    const order = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
    
    if (sortField === 'createdAt') {
      query = query.orderBy(`${sortField} ${order}`);
    } else {
      query = query.orderBy(`${sortField} ${order}`);
    }

    const books = await cds.run(query);


    for (const book of books) {
      const bookCategories = await cds.run(
        cds.SELECT.from(BookCategories)
          .columns(bc => { bc.category(c => { c.name }) })
          .where({ book_ID: book.ID })
      );
      book.categories = bookCategories.map(bc => bc.category?.name).filter(Boolean);
    }

    return books;
  });


  this.on('getRecommendations', async (req) => {
    const { bookId, limit = 5 } = req.data;

    const bookCategories = await cds.run(
      cds.SELECT.from(BookCategories)
        .where({ book_ID: bookId })
    );

    if (bookCategories.length === 0) return [];

    const categoryIds = bookCategories.map(bc => bc.category_ID);


    const similarBookIds = await cds.run(
      cds.SELECT.from(BookCategories)
        .columns('book_ID')
        .where({ 
          category_ID: { in: categoryIds },
          book_ID: { '!=': bookId }
        })
    );

    if (similarBookIds.length === 0) return [];

    const recommendations = await cds.run(
      cds.SELECT.from(Books)
        .columns(b => {
          b.ID, b.title, b.author, b.price, b.averageRating, 
          b.totalReviews, b.coverImageUrl
        })
        .where({ 
          ID: { in: similarBookIds.map(item => item.book_ID) },
          isActive: true,
          stock: { '>': 0 }
        })
        .orderBy('averageRating desc', 'totalReviews desc')
        .limit(limit)
    );

    return recommendations;
  });


  this.on('getFeaturedBooks', async (req) => {
    const { limit = 10 } = req.data;

    return await cds.run(
      cds.SELECT.from(Books)
        .columns(b => {
          b.ID, b.title, b.author, b.price, b.averageRating, 
          b.totalReviews, b.coverImageUrl
        })
        .where({ 
          isActive: true,
          isFeatured: true,
          stock: { '>': 0 }
        })
        .orderBy('createdAt desc')
        .limit(limit)
    );
  });


  this.on('getBooksByCategory', async (req) => {
    const { categoryId, page = 1, pageSize = 12 } = req.data;
    const offset = (page - 1) * pageSize;


    const bookCategories = await cds.run(
      cds.SELECT.from(BookCategories)
        .columns('book_ID')
        .where({ category_ID: categoryId })
    );

    if (bookCategories.length === 0) {
      return { books: [], totalCount: 0, totalPages: 0 };
    }

    const bookIds = bookCategories.map(bc => bc.book_ID);


    const totalCount = await cds.run(
      cds.SELECT.from(Books)
        .columns('count(*) as count')
        .where({ 
          ID: { in: bookIds },
          isActive: true 
        })
    );

    const books = await cds.run(
      cds.SELECT.from(Books)
        .columns(b => {
          b.ID, b.title, b.author, b.price, b.averageRating, 
          b.totalReviews, b.coverImageUrl, b.stock
        })
        .where({ 
          ID: { in: bookIds },
          isActive: true 
        })
        .orderBy('title asc')
        .limit(pageSize, offset)
    );

    const total = totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      books,
      totalCount: total,
      totalPages
    };
  });

  this.after('READ', 'Books', async (books, req) => {
    if (!Array.isArray(books)) books = [books];
    

    for (const book of books.filter(Boolean)) {
      console.log(`Book viewed: ${book.title} (${book.ID})`);
    }
  });
});
