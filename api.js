const express = require('express'); // Import express framework
const app = express(); // Buat instance aplikasi express
const { Pool } = require('pg'); // Import Pool dari library pg (PostgreSQL)

// Koneksi database PostgreSQL
const pool = new Pool({
  user: 'postgres', // Username database
  host: 'localhost', // Host database
  database: 'openpaymentdata', // Nama database
  password: 'root', // Password database
  port: 5432 // Port database
});

// Endpoint untuk data research_payments
app.get('/research_payments', async (req, res) => {
  // Ambil query params dengan default value
  const {
    limit = 10,
    offset = 0,
    sort_by = 'Record_ID',
    order = 'asc',
    ...filters // Sisanya jadi filter
  } = req.query;

  const parsedLimit = parseInt(limit); // Ubah limit ke integer
  const parsedOffset = parseInt(offset); // Ubah offset ke integer
  const page = Math.floor(parsedOffset / parsedLimit) + 1; // Hitung halaman

  let whereClauses = []; // Array untuk kondisi WHERE
  let values = []; // Array untuk nilai parameter query

  // Loop setiap filter, buat kondisi WHERE dinamis
  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`); // Tambah kondisi
    values.push(value); // Tambah nilai
  });

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''; // Gabung kondisi WHERE
  const orderSQL = `"${sort_by}" ${order.toLowerCase()}`; // SQL untuk ORDER BY

  // Query utama untuk ambil data
  const query = `
    SELECT 
    *
    FROM research_payments
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  // Query untuk hitung total data
  const countQuery = `
    SELECT COUNT(*) FROM research_payments
    ${whereSQL};
  `;

  values.push(parsedLimit, parsedOffset); // Tambah limit & offset ke values

  const errors = []; // Array untuk error validasi

  // Validasi parameter limit
  if (isNaN(limit) || parseInt(limit) <= 0) {
    errors.push('limit must be a positive integer.');
  }
  // Validasi parameter offset
  if (isNaN(offset) || parseInt(offset) < 0) {
    errors.push('offset must be a non-negative integer.');
  }
  // Validasi order
  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push("order must be either 'asc' or 'desc'.");
  }

  // Jika ada error validasi, kirim response error
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }

  try {
    // Eksekusi query data
    const result = await pool.query(query, values);

    // Eksekusi query count
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count); // Total data
    const totalPages = Math.ceil(totalCount / parsedLimit); // Total halaman

    // Kirim response sukses
    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    // Jika error, kirim response error
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Endpoint untuk data general_payments (DUPLIKAT, sebaiknya hapus salah satu)
app.get('/general_payments', async (req, res) => {
  // Ambil query params dengan default value
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

  // Loop filter untuk WHERE
  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`);
    values.push(value);
  });

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const orderSQL = `"${sort_by}" ${order.toLowerCase()}`;

  // Query utama
  const query = `
    SELECT 
    *
    FROM general_payments
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  // Query count
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

  // Validasi sort_by
  const allowedSortFields = ['recipient_city', 'recipient_state','recipient_country', 'payment_publication_date', 'date_of_payment'];
  if (!allowedSortFields.includes(sort_by)) {
    errors.push(`sort_by must be one of: ${allowedSortFields.join(', ')}.`);
  }

  // Jika error validasi, kirim error
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }

  try {
    // Query data
    const result = await pool.query(query, values);
    // Query count
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    // Kirim response sukses
    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    // Jika error, kirim response error
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Endpoint untuk data ownership
app.get('/ownership', async (req, res) => {
  // Ambil query params dengan default value
  const {
    limit = 1, // default limit 1
    offset = 0, // default offset 0
    sort_by = 'record_id', // default sort
    order = 'asc', // default order
    ...filters // filter dinamis
  } = req.query;

  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  const page = Math.floor(parsedOffset / parsedLimit) + 1;

  let whereClauses = [];
  let values = [];

  // Loop filter untuk WHERE
  Object.entries(filters).forEach(([key, value], index) => {
    whereClauses.push(`"${key}" = $${index + 1}`);
    values.push(value);
  });

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const orderSQL = `"${sort_by}" ${order.toLowerCase()}`;

  // Query utama
  const query = `
    SELECT record_id,
    
    FROM ownership
    ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2};
  `;

  // Query count
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

  // Validasi sort_by
  const allowedSortFields = ['record_id','physician_npi'];
  if (!allowedSortFields.includes(sort_by)) {
    errors.push(`sort_by must be one of: ${allowedSortFields.join(', ')}.`);
  }

  // Jika error validasi, kirim error
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'Bad Request',
      message: errors.join(' ')
    });
  }

  try {
    // Query data
    const result = await pool.query(query, values);
    // Query count
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / parsedLimit);

    // Kirim response sukses
    res.json({
      status: "success",
      message: "Data fetched successfully",
      page,
      total_pages: totalPages,
      records_shown: result.rowCount,
      data: result.rows
    });

  } catch (err) {
    // Jika error, kirim response error
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error"
    });
  }
});

// Jalankan server di port 3000
app.listen(3000, () => {
  console.log('Server is running on port http://localhost:3000');
});