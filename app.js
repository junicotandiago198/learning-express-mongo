const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const { body, validationResult, check } = require('express-validator');
var methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();
const port = 3000;

// setup method-override
app.use(methodOverride('_method'));

// set up ejs view egine template
app.set('view engine', 'ejs');

// konfigurasi flash
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: 'true',
    saveUninitialized: true,
  })
);
app.use(flash());

// Third-party middleware
app.use(expressLayouts);

// built-in middleware express-static
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

require('./utils/db');
const Contact = require('./model/contact');

// Halaman Home
app.get('/', (req, res) => {
  const mahasiswa = [
    {
      nama: 'Junico Tandiago',
      email: 'junico@gmail.com',
    },
    {
      nama: 'Erik',
      email: 'erik@gmail.com',
    },
    {
      nama: 'Doddy Ferdiansyah',
      email: 'doddy@gmail.com',
    },
  ];
  res.render('index', {
    nama: 'Junico Tandiago',
    title: 'Halaman Home',
    mahasiswa,
    layout: 'layouts/main-layouts',
  });
});

// Halaman About
app.get('/about', (req, res) => {
  // res.send('Ini adalah halaman about !');
  // res.sendFile('./about.html', { root: __dirname });
  res.render('about', { layout: 'layouts/main-layouts', title: 'Halaman About' });
});

// Halaman Contact
app.get('/contact', async (req, res) => {
  const contacts = await Contact.find();
  res.render('contact', {
    layout: 'layouts/main-layouts',
    title: 'Halaman Contact',
    contacts,
    msg: req.flash('msg'),
  });
});

// Halaman form tambah data contact
app.get('/contact/add', (req, res) => {
  res.render('add-contact', { title: 'Form tambah data kontak', layout: 'layouts/main-layouts' });
});

// proses tambah data kontak
app.post(
  '/contact',
  [
    body('nama').custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error('Nama contact sudah digunakan!');
      }
      return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'No Hp tidak valid!').isMobilePhone('id-ID'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layouts/main-layouts',
        errors: errors.array(),
      });
    } else {
      Contact.insertMany(req.body, (error, result) => {
        // kirimkan flash message
        req.flash('msg', 'Data contact berhasil ditambahkan!');
        res.redirect('/contact');
      });
    }
  }
);

// proses delete contact
app.delete('/contact', (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash('msg', 'Data contact berhasil dihapus!');
    res.redirect('/contact');
  });
});

// Halaman form ubah data contact
app.get('/contact/edit/:nama', async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render('edit-contact', {
    title: 'Form ubah data kontak',
    layout: 'layouts/main-layouts',
    contact,
  });
}); // proses ubah data contact
app.post(
  '/contact/update',
  [
    body('nama').custom((value, { req }) => {
      const duplikat = cekDuplikat(value);
      if (value !== req.body.oldNama && duplikat) {
        throw new Error('Nama contact sudah digunakan!');
      }
      return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'No Hp tidak valid!').isMobilePhone('id-ID'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layouts',
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      updateContacts(req.body);
      // kirimkan flash message
      req.flash('msg', 'Data contact berhasil diubah!');
      res.redirect('/contact');
    }
  }
);

// proses ubah data contact
app.put(
  '/contact',
  [
    body('nama').custom(async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (value !== req.body.oldNama && duplikat) {
        throw new Error('Nama contact sudah digunakan!');
      }
      return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('nohp', 'No Hp tidak valid!').isMobilePhone('id-ID'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layouts',
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            nama: req.body.nama,
            email: req.body.email,
            nohp: req.body.nohp,
          },
        }
      ).then((result) => {
        // kirimkan flash message
        req.flash('msg', 'Data contact berhasil diubah!');
        res.redirect('/contact');
      });
    }
  }
);

// Halaman detail data contact
app.get('/contact/:nama', async (req, res) => {
  // const contact = findContact(req.params.nama);
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render('detail', { title: 'Halaman Detail Contact', layout: 'layouts/main-layouts', contact });
});

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
