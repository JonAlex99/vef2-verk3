import express from 'express';
import { list, lengdLista, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';
import passport from './login.js';

// TODO útfæra „bakvinnslu“
export const router = express.Router();

async function admin(req, res) {
  const errors = [];
  const formData = {
    name: '',
    nationalId: '',
    anonymous: false,
    comment: '',
  };

  let { page = 1 } = req.query;
  page = Number(page);

  const offset = Number((page - 1) * 50);
  const limit = Number(page * 50);

  const registrations = await list(offset, limit);

  const result = {
    links: {
      self: {
        href: `?page=${page}`,
      },
    },
    items: registrations,
  };

  if (offset > 0) {
    result.links.prev = {
      href: `?page=${page - 1}`,
    };
  }

  if (registrations.length <= limit) {
    result.links.next = {
      href: `?page=${page + 1}`,
    };
  }

  const lengdin = await lengdLista();
  const adminOn = 1;

  res.render('admin', {
    errors, formData, registrations, result, page, lengdin, adminOn,
  });
}

async function login(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { message });
}

async function deleteFromRow(req, res) {
  const { id } = req.body;

  await deleteRow([id]);

  return res.redirect('/admin');
}

router.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout();
  res.redirect('/');
});

router.use((req, res, next) => {
  if (req.isAuthenticated()) {
    // getum núna notað user í viewum
    res.locals.user = req.user;
  }

  next();
});

router.get('/', ensureLoggedIn, catchErrors(admin));
router.get('/login', catchErrors(login));
router.post('/delete', ensureLoggedIn, catchErrors(deleteFromRow));

router.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/admin/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  },
);
