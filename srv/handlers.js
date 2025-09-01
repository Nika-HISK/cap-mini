const cds = require('@sap/cds');
const { SELECT } = cds;

module.exports = cds.service.impl(function () {
  const { Books } = this.entities;

  this.before('CREATE', 'Books', (req) => {
    if (req.data.stock < 0) req.error(400, 'Stock cannot be negative');
    if (req.data.price < 0) req.error(400, 'Price cannot be negative');
    if (req.data.title) req.data.title = req.data.title.trim();
  });


  this.before('PATCH', 'Books', (req) => {
    if ('stock' in req.data && req.data.stock < 0) req.error(400, 'Stock cannot be negative');
    if ('price' in req.data && req.data.price < 0) req.error(400, 'Price cannot be negative');
    if ('title' in req.data && req.data.title) req.data.title = req.data.title.trim();
  });

 
  this.on('restock', async (req) => {
    const { ID, amount } = req.data;
    if (!amount || amount <= 0) return req.error(400, 'amount must be > 0');
  
    const tx = cds.transaction(req);
    const { Books } = this.entities;
    const book = await tx.run(SELECT.one.from(Books).where({ ID }));
    if (!book) return req.error(404, 'Book not found');
  
    await tx.update(Books).set({ stock: { '+=': amount } }).where({ ID });
    return true;
  });
  
  this.on('searchBooks', async (req) => {
    const q = (req.data.q || '').trim();
    if (!q) return [];
    const like = `%${q}%`;
    return SELECT.from(Books).where({ or: [
      { title: { like } },
      { author: { like } }
    ]});
  });
});