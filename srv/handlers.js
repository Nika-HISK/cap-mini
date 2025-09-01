const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities;


  this.before('CREATE', 'Books', (req) => {
    if (req.data.stock < 0) req.error(400, 'Stock cannot be negative');
    if (req.data.price < 0) req.error(400, 'Price cannot be negative');
    if (req.data.title) req.data.title = req.data.title.trim();
  });


  this.before('UPDATE', 'Books', (req) => {
    if ('stock' in req.data && req.data.stock < 0) req.error(400, 'Stock cannot be negative');
    if ('price' in req.data && req.data.price < 0) req.error(400, 'Price cannot be negative');
    if ('title' in req.data && req.data.title) req.data.title = req.data.title.trim();
  });

  
  this.on('restock', async (req) => {
    const { ID, amount } = req.data;
    

    if (!ID) return req.error(400, 'ID is required');
    if (!amount || amount <= 0) return req.error(400, 'Amount must be greater than 0');
  
    try {
      const tx = cds.transaction(req);

      const book = await tx.run(
        cds.SELECT.one.from(Books).where({ ID })
      );
      
      if (!book) return req.error(404, 'Book not found');
  
      await tx.run(
        cds.UPDATE(Books)
          .set({ stock: book.stock + amount })
          .where({ ID })
      );
      
      return true;
    } catch (error) {
      console.error('Error in restock action:', error);
      return req.error(500, 'Internal server error');
    }
  });
  

  this.on('searchBooks', async (req) => {
    const q = (req.data.q || '').trim();
    if (!q) return [];
    
    const like = `%${q}%`;
    
    try {
      return await cds.run(
        cds.SELECT.from(Books).where({
          or: [
            { title: { like } },
            { author: { like } }
          ]
        })
      );
    } catch (error) {
      console.error('Error in searchBooks function:', error);
      return req.error(500, 'Internal server error');
    }
  });
});