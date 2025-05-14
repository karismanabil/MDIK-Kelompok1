const express = require('express');
const app = express();
const { Pool } = require('pg');

// Koneksi database
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'openpaymentdata',
  password: 'root',
  port: 5432
});


app.get('/research_payments', async (req, res) => {
  const {
    limit = 10,
    offset = 0,
    sort_by = 'Record_ID',
    order = 'asc',
    ...filters
  } = req.query;

  

  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  const page = Math.floor(parsedOffset / parsedLimit) + 1;

  let whereClauses = [];
  let values = [];

  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`);
    values.push(value);
  });

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const orderSQL = `"${sort_by}" ${order.toUpperCase()}`;

  const query = `
    SELECT * FROM research_payments
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  const countQuery = `
    SELECT COUNT(*) FROM research_payments
    ${whereSQL};
  `;

  values.push(parsedLimit, parsedOffset);

  const errors = [];

  // Validasi parameter
  if (isNaN(limit) || parseInt(limit) <= 0) {
    errors.push('limit must be a positive integer.');
  }
  if (isNaN(offset) || parseInt(offset) < 0) {
    errors.push('offset must be a non-negative integer.');
  }
  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push("order must be either 'asc' or 'desc'.");
  }

  // validasi sort_by kolom yang bisa disort
  const allowedSortFields = ['Record_ID','Recipient_City', 'Recipient_State','Recipient_Country', 'Payment_Publication_Date'];
  if (!allowedSortFields.includes(sort_by)) {
    errors.push(`sort_by must be one of: ${allowedSortFields.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }

  try {
    // Ambil data
    const result = await pool.query(query, values);

    // Ambil total data
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});


app.get('/general_payments', async (req, res) => {
  const {
    limit = 10,
    offset = 0,
    sort_by = 'date_of_payment',
    order = 'asc',
    ...filters
  } = req.query;

  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  const page = Math.floor(parsedOffset / parsedLimit) + 1;

  let whereClauses = [];
  let values = [];

  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`);
    values.push(value);
  });

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const orderSQL = `"${sort_by}" ${order.toLowerCase()}`;

  const query = `
    SELECT * FROM general_payments
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  const countQuery = `
    SELECT COUNT(*) FROM general_payments
    ${whereSQL};
  `;

  values.push(parsedLimit, parsedOffset);


  const errors = [];

  // Validasi parameter
  if (isNaN(limit) || parseInt(limit) <= 0) {
    errors.push('limit must be a positive integer.');
  }
  if (isNaN(offset) || parseInt(offset) < 0) {
    errors.push('offset must be a non-negative integer.');
  }
  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push("order must be either 'asc' or 'desc'.");
  }

  // validasi sort_by kolom yang bisa disort
  const allowedSortFields = ['recipient_city', 'recipient_state','recipient_country', 'payment_publication_date', 'date_of_payment'];
  if (!allowedSortFields.includes(sort_by)) {
    errors.push(`sort_by must be one of: ${allowedSortFields.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }


  try {
    const result = await pool.query(query, values);
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});



app.get('/ownership', async (req, res) => {
  const {
    limit = 1, // default limit 10
    offset = 0, // default offset 0 (page 1 (0) = 0-9, page 2 (10) = 10-19)
    sort_by = 'record_id', // default sorting
    order = 'asc', // default sort ascending
    ...filters // mengambil semua query params selain limit, offset, sort_by, order
  } = req.query;

  // Mengubah tipe data
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  const page = Math.floor(parsedOffset / parsedLimit) + 1;

  // Membuat kondisi dinamis untuk query SQL
  let whereClauses = [];
  let values = [];

  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`);
    values.push(value);
  });

  // Filter berdasarkan query parameters yang diterima
  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  // Sorting SQL
  const orderSQL = `"${sort_by}" ${order.toLowerCase()}`;

  // pagination query
  const query = `
    SELECT * FROM ownership
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  // jumlah query
  const countQuery = `
    SELECT COUNT(*) FROM ownership
    ${whereSQL};
  `;

  values.push(parsedLimit, parsedOffset);

  const errors = [];

  // Validasi parameter
  if (isNaN(limit) || parseInt(limit) <= 0) {
    errors.push('limit must be a positive integer.');
  }
  if (isNaN(offset) || parseInt(offset) < 0) {
    errors.push('offset must be a non-negative integer.');
  }
  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push("order must be either 'asc' or 'desc'.");
  }

  // validasi sort_by kolom yang bisa disort
  const allowedSortFields = ['record_id','recipient_city', 'recipient_state','recipient_country', 'payment_publication_date'];
  if (!allowedSortFields.includes(sort_by)) {
    errors.push(`sort_by must be one of: ${allowedSortFields.join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }

  try {
    const result = await pool.query(query, values);
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port http://localhost:3000');
});
