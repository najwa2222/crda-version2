// app.js – Unified application code
// Ensure your package.json includes "type": "module" if you use ES modules.
import express from 'express';
import { engine } from 'express-handlebars';
import mysql from 'mysql2/promise';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import helmet from 'helmet';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Environment and configuration settings
const PORT = process.env.PORT || 4200;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// Database configuration – these values come from the environment.
// Use a local .env file for development; production should inject these variables.
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'base_crda',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
};

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-insecure-secret';

// Database connection parameters and retry settings
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;
let connection; // Will store the MySQL connection

// Create the MySQL connection using promise-based API.
async function createConnection() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log(`Connected to MySQL server as ID ${conn.threadId}`);
    return conn;
  } catch (err) {
    console.error('MySQL connection error:', err.message);
    throw err;
  }
}

// Retry connecting to the database if needed.
async function initializeDatabase(retries = MAX_RETRIES) {
  try {
    connection = await createConnection();
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying connection... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      setTimeout(() => initializeDatabase(retries - 1), RETRY_INTERVAL);
    } else {
      console.error('Failed to connect to MySQL after retries:', err.message);
      process.exit(1);
    }
  }
}

// --- Middleware Setup ---
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PROD, // In production, cookies are marked secure (requires HTTPS)
    httpOnly: true,
    sameSite: 'strict',
  },
}));

// Make session user available in all views.
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use((req, res, next) => {
  if (!connection) {
    return res.status(503).send('Database not ready');
  }
  next();
});


// --- View Engine Setup (Handlebars) ---
app.engine('.hbs', engine({
  extname: '.hbs',
  helpers: {
    eq: (a, b) => a === b,
    statusClass: (status) => {
      switch (status) {
        case 'مقبول': return 'bg-green-100 text-green-800 border-green-200';
        case 'مرفوض': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    },
  },
}));
app.set('view engine', '.hbs');
app.set('views', './views');

// --- Authentication and Role-Based Middleware ---
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/login?error=not_logged_in');
};

const createRoleCheck = (...allowedRoles) => (req, res, next) => {
  if (!req.session.user || !allowedRoles.includes(req.session.user.role_user)) {
    return res.redirect('/login?error=unauthorized');
  }
  next();
};

const isChef = createRoleCheck('chef_dentreprise');
const isGerant = createRoleCheck('gerant');
const isDirecteur = createRoleCheck('directeur');

// --- Routes ---

// Health check: used by container orchestration to ensure the app is running.
app.get('/health', async (req, res) => {
  if (!connection) {
    return res.status(503).send('DB not connected yet');
  }
  try {
    await connection.query('SELECT 1');
    res.status(200).send('OK');
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).send('DB query failed');
  }
});


// Home and About pages
app.get('/', (req, res) => res.render('index', { title: 'Home', layout: 'main' }));
app.get('/about', (req, res) => res.render('about', { title: 'من نحن', user: req.session.user }));

// --- Authentication Routes ---

// Render the login page.
app.get('/login', (req, res) => {
  res.render('login', { title: 'تسجيل الدخول', layout: 'main', error: req.query.error, success: req.query.success });
});

// Handle login. In production, use bcrypt to compare passwords.
app.post('/login', async (req, res) => {
  const { email_user, password_user } = req.body;

  console.log('➡️ Login attempt:', { email_user, password_user });

  try {
    const [users] = await connection.query('SELECT * FROM utilisateur WHERE email_user = ?', [email_user]);

    if (!users.length) {
      console.log('❌ No user found with email:', email_user);
      return res.redirect('/login?error=invalid_credentials');
    }

    const user = users[0];
    console.log('✅ User record found:', user);

    let match = false;

    if (IS_PROD) {
      console.log('🔐 Production mode: comparing hash...');
      match = await bcrypt.compare(password_user, user.password_user);
    } else {
      console.log('🧪 Dev mode: comparing plain passwords...');
      match = password_user === user.password_user;
    }

    console.log('🔍 Password match result:', match);

    if (!match) {
      console.log('❌ Passwords do not match');
      return res.redirect('/login?error=invalid_credentials');
    }

    if (user.status_user !== 'approved') {
      console.log('⛔ User not approved:', user.status_user);
      return res.redirect('/unapproved_login');
    }

    req.session.user = {
      id: user.id,
      email_user: user.email_user,
      role_user: user.role_user,
      nom_user: user.nom_user,
      prenom_user: user.prenom_user,
    };

    console.log('✅ Login success — redirecting user with role:', user.role_user);

    const routes = {
      chef_dentreprise: '/getservices',
      gerant: '/getreports',
      directeur: '/results',
    };

    res.redirect(routes[user.role_user] || '/login?error=invalid_role');

  } catch (err) {
    console.error('🚨 Login error:', err.message);
    res.redirect('/login?error=server_error');
  }
});


// Logout route.
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Session destruction error:', err.message);
    res.redirect('/login');
  });
});

// --- Registration Routes ---
app.get('/register', (req, res) =>
  res.render('register', { title: 'تسجيل جديد', layout: 'main', error: req.query.error, success: req.query.success })
);

app.post('/register', async (req, res) => {
  const { email_user, password_user, role_user, nom_user, prenom_user, sex_user, cin_user } = req.body;
  if (!email_user.endsWith('@crda.com')) {
    return res.redirect('/register?error=invalid_domain');
  }
  if (!email_user || !password_user || !role_user || !nom_user || !prenom_user || !sex_user || !cin_user) {
    return res.redirect('/register?error=missing_fields');
  }
  try {
    const [existing] = await connection.query('SELECT * FROM utilisateur WHERE email_user = ? OR cin_user = ?', [email_user, cin_user]);
    if (existing.length) return res.redirect('/register?error=exists');
    const finalPassword = await bcrypt.hash(password_user, 10);
    await connection.query(
      `INSERT INTO utilisateur 
         (email_user, password_user, role_user, status_user, nom_user, prenom_user, sex_user, cin_user)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [email_user, finalPassword, role_user, nom_user, prenom_user, sex_user, cin_user]
    );
    res.redirect('/pending_approval');
  } catch (err) {
    console.error('Registration error:', err.message);
    res.redirect('/register?error=database_error');
  }
});

app.get('/pending_approval', (req, res) =>
  res.render('pending_approval', { title: 'تم التسجيل', message: 'شكراً لتسجيلك. سيتم مراجعة طلبك قريباً.' })
);

app.get('/unapproved_login', (req, res) =>
  res.render('unapproved_login', { title: 'لم يتم التحقق', message: 'حسابك لم يتم الموافقة عليه بعد. يرجى المحاولة لاحقاً.' })
);

// --- Services Routes ---

// Render a form to add a new service.
app.get('/services', isAuthenticated, (req, res) => {
  res.render('services', { title: 'المحتوى', layout: 'main', user: req.session.user });
});

// Display all services for the chef role.
// Joins with the "rapport" table to determine the status.
app.get('/getservices', isAuthenticated, isChef, async (req, res) => {
  try {
    const [services] = await connection.query(
      `SELECT s.*, IF(r.id IS NOT NULL, 'تم', 'قيد الانتظار') AS status
       FROM services_utilisateur s
       LEFT JOIN rapport r ON s.cin = r.cin AND s.sujet = r.sujet`
    );
    res.render('afficher', { title: 'المحتوى', services, user: req.session.user });
  } catch (err) {
    console.error('Database error:', err.message);
    res.redirect('/getservices?error=database_error');
  }
});

// Render form to edit an existing service.
app.get('/editservice/:id', isAuthenticated, isChef, async (req, res) => {
  try {
    const [results] = await connection.query('SELECT * FROM services_utilisateur WHERE id = ?', [req.params.id]);
    if (!results.length) return res.redirect('/getservices');
    res.render('editservice', { title: 'تعديل الطلب', layout: 'main', service: results[0], user: req.session.user });
  } catch (err) {
    console.error('Error fetching service:', err.message);
    res.redirect('/getservices?error=database_error');
  }
});

// Add a new service.
app.post('/addservice', isAuthenticated, async (req, res) => {
  const {
    sujet, prenom, nom, cin, numero_transaction,
    certificat_propriete_terre, copie_piece_identite_fermier,
    copie_piece_identite_nationale, demande_but,
    copie_contrat_location_terrain, autres_documents
  } = req.body;
  try {
    await connection.query(
      `INSERT INTO services_utilisateur 
         (sujet, prenom, nom, cin, numero_transaction, certificat_propriete_terre, 
          copie_piece_identite_fermier, copie_piece_identite_nationale, demande_but, 
          copie_contrat_location_terrain, autres_documents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sujet, prenom, nom, cin, numero_transaction,
        certificat_propriete_terre === 'true',
        copie_piece_identite_fermier === 'true',
        copie_piece_identite_nationale === 'true',
        demande_but === 'true',
        copie_contrat_location_terrain === 'true',
        autres_documents === 'true'
      ]
    );
    res.redirect('/getservices');
  } catch (err) {
    console.error('Add service error:', err.message);
    res.redirect('/services?error=database_error');
  }
});

// Update an existing service.
app.post('/updateservice/:id', isAuthenticated, isChef, async (req, res) => {
  const {
    sujet, prenom, nom, cin, numero_transaction,
    certificat_propriete_terre = false, copie_piece_identite_fermier = false,
    copie_piece_identite_nationale = false, demande_but = false,
    copie_contrat_location_terrain = false, autres_documents = false
  } = req.body;
  try {
    await connection.query(
      `UPDATE services_utilisateur
       SET sujet = ?, prenom = ?, nom = ?, cin = ?, numero_transaction = ?,
           certificat_propriete_terre = ?, copie_piece_identite_fermier = ?,
           copie_piece_identite_nationale = ?, demande_but = ?,
           copie_contrat_location_terrain = ?, autres_documents = ?
       WHERE id = ?`,
      [
        sujet, prenom, nom, cin, numero_transaction,
        certificat_propriete_terre === 'on',
        copie_piece_identite_fermier === 'on',
        copie_piece_identite_nationale === 'on',
        demande_but === 'on',
        copie_contrat_location_terrain === 'on',
        autres_documents === 'on',
        req.params.id
      ]
    );
    res.redirect('/getservices');
  } catch (err) {
    console.error('Update service error:', err.message);
    res.redirect(`/editservice/${req.params.id}?error=update_failed`);
  }
});

// --- Report Routes ---

// Render form for creating a new report.
app.get('/report', isAuthenticated, isGerant, (req, res) => {
  res.render('report', { title: 'إنشاء تقرير', layout: 'main', isViewing: false, ...req.query, user: req.session.user });
});

// Render view for a report.
app.get('/viewreport', isAuthenticated, (req, res) => {
  const { cin, sujet } = req.query;
  if (!req.session.user || !['gerant', 'directeur'].includes(req.session.user.role_user)) {
    return res.redirect('/login?error=unauthorized');
  }
  (async () => {
    try {
      const [results] = await connection.query('SELECT * FROM rapport WHERE cin = ? AND sujet = ?', [cin, sujet]);
      if (!results.length) return res.redirect(req.session.user.role_user === 'gerant' ? '/getreports' : '/results');
      res.render('report', { title: 'عرض التقرير', layout: 'main', isViewing: true, report: results[0], user: req.session.user });
    } catch (err) {
      console.error('View report error:', err.message);
      res.redirect('/getreports?error=database_error');
    }
  })();
});

// List reports.
app.get('/getreports', isAuthenticated, isGerant, async (req, res) => {
  try {
    const [reports] = await connection.query('SELECT * FROM rapport ORDER BY id DESC');
    res.render('getreports', { title: 'قائمة التقارير', reports, user: req.session.user });
  } catch (err) {
    console.error('Get reports error:', err.message);
    res.redirect('/getreports?error=database_error');
  }
});

// Render form to edit a report.
app.get('/editreport/:id', isAuthenticated, isGerant, async (req, res) => {
  try {
    const [results] = await connection.query('SELECT * FROM rapport WHERE id = ?', [req.params.id]);
    if (!results.length) return res.redirect('/getreports');
    res.render('edit-report', { title: 'تعديل التقرير', report: results[0], user: req.session.user });
  } catch (err) {
    console.error('Edit report error:', err.message);
    res.redirect('/getreports?error=database_error');
  }
});

// Add a new report and update corresponding service status.
app.post('/addreport', isAuthenticated, async (req, res) => {
  const { cin, sujet, nom, prenom, surface, limites_terrain, localisation, superficie_batiments_anciens, observations } = req.body;
  if (!cin || !sujet) {
    return res.redirect('/getreports?error=missing_required_fields');
  }
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO rapport 
         (cin, sujet, nom, prenom, surface, limites_terrain, localisation, superficie_batiments_anciens, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cin, sujet, nom, prenom,
        surface || null, limites_terrain || null, localisation || null, superficie_batiments_anciens || null, observations || null
      ]
    );
    await connection.query(
      `UPDATE services_utilisateur SET status = 'تم' WHERE cin = ? AND sujet = ?`,
      [cin, sujet]
    );
    await connection.commit();
    res.redirect('/getreports');
  } catch (err) {
    await connection.rollback();
    console.error('Add report error:', err.message);
    res.redirect(`/report?cin=${cin}&sujet=${sujet}&error=database_error`);
  }
});

// Update an existing report.
app.post('/updatereport/:id', isAuthenticated, isGerant, async (req, res) => {
  const { surface, limites_terrain, localisation, superficie_batiments_anciens, observations } = req.body;
  try {
    await connection.query(
      `UPDATE rapport
       SET surface = ?, limites_terrain = ?, localisation = ?, superficie_batiments_anciens = ?, observations = ?
       WHERE id = ?`,
      [surface, limites_terrain, localisation, superficie_batiments_anciens, observations, req.params.id]
    );
    res.redirect('/getreports');
  } catch (err) {
    console.error('Update report error:', err.message);
    res.redirect(`/editreport/${req.params.id}?error=update_failed`);
  }
});

// --- Results Routes ---

// List results (for the directeur role).
app.get('/results', isAuthenticated, isDirecteur, async (req, res) => {
  try {
    const [services] = await connection.query(
      `SELECT s.*, r.statut, rap.id AS report_id
       FROM services_utilisateur s
       LEFT JOIN results r ON s.cin = r.cin AND s.sujet = r.sujet
       INNER JOIN rapport rap ON s.cin = rap.cin AND s.sujet = rap.sujet
       ORDER BY s.id DESC`
    );
    res.render('results', { title: 'النتائج النهائية', services, user: req.session.user });
  } catch (err) {
    console.error('Get results error:', err.message);
    res.redirect('/results?error=database_error');
  }
});

// Render form to edit a specific result.
app.get('/editresult/:id', isAuthenticated, isDirecteur, async (req, res) => {
  try {
    const [results] = await connection.query(
      `SELECT s.*, r.statut
       FROM services_utilisateur s
       LEFT JOIN results r ON s.cin = r.cin AND s.sujet = r.sujet
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!results.length) return res.redirect('/results');
    res.render('editresult', { title: 'تعديل النتيجة', service: results[0], result: results[0].statut || 'pending', user: req.session.user });
  } catch (err) {
    console.error('Edit result error:', err.message);
    res.redirect('/results?error=database_error');
  }
});

// Update a result. Only allowed statuses are 'مقبول' and 'مرفوض'.
app.post('/updateresult', isAuthenticated, isDirecteur, async (req, res) => {
  const { id, sujet, nom, prenom, cin, numero_transaction, statut } = req.body;
  const allowedStatuses = ['مقبول', 'مرفوض'];
  if (!allowedStatuses.includes(statut)) {
    return res.status(400).send('الحالة المحددة غير صالحة');
  }
  try {
    await connection.query(
      `INSERT INTO results (sujet, nom, prenom, cin, numero_transaction, statut)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE statut = ?`,
      [sujet, nom, prenom, cin, numero_transaction, statut, statut]
    );
    res.redirect('/results');
  } catch (err) {
    console.error('Update result error:', err.message);
    res.redirect(`/editresult/${id}?error=update_failed`);
  }
});

// --- Admin Routes ---

// List pending accounts for approval.
app.get('/admin/pending-accounts', isAuthenticated, isDirecteur, async (req, res) => {
  try {
    const [accounts] = await connection.query(
      `SELECT id, email_user, nom_user, prenom_user, role_user
       FROM utilisateur
       WHERE status_user = 'pending'`
    );
    res.render('admin/pending-accounts', { title: 'الحسابات المعلقة', accounts, user: req.session.user });
  } catch (err) {
    console.error('Admin pending accounts error:', err.message);
    res.redirect('/admin/pending-accounts?error=database_error');
  }
});

// Approve an account.
app.post('/admin/approve-account/:id', isAuthenticated, isDirecteur, async (req, res) => {
  try {
    await connection.query('UPDATE utilisateur SET status_user = "approved" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/pending-accounts');
  } catch (err) {
    console.error('Approve account error:', err.message);
    res.redirect('/admin/pending-accounts?error=approve_failed');
  }
});

// Reject (delete) an account.
app.post('/admin/reject-account/:id', isAuthenticated, isDirecteur, async (req, res) => {
  try {
    await connection.query('DELETE FROM utilisateur WHERE id = ?', [req.params.id]);
    res.redirect('/admin/pending-accounts');
  } catch (err) {
    console.error('Reject account error:', err.message);
    res.redirect('/admin/pending-accounts?error=reject_failed');
  }
});

// --- API DELETE Endpoints ---

// Delete a service.
app.delete('/api/services/:id', isAuthenticated, async (req, res) => {
  try {
    await connection.query('DELETE FROM services_utilisateur WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a result.
app.delete('/api/results', isAuthenticated, async (req, res) => {
  const { cin, sujet } = req.body;
  try {
    await connection.query('DELETE FROM results WHERE cin = ? AND sujet = ?', [cin, sujet]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a report (including deleting any associated results) inside a transaction.
app.delete('/api/reports/:id', isAuthenticated, isGerant, async (req, res) => {
  try {
    await connection.beginTransaction();
    const [results] = await connection.query('SELECT cin, sujet FROM rapport WHERE id = ?', [req.params.id]);
    if (!results.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Report not found' });
    }
    const { cin, sujet } = results[0];
    await connection.query('DELETE FROM results WHERE cin = ? AND sujet = ?', [cin, sujet]);
    await connection.query('DELETE FROM rapport WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  }
});

// --- Check Status Routes ---

// Render a form to check status.
app.get('/check-status', (req, res) => {
  res.render('check-status', { title: 'التحقق من الحالة', result: null, error: null });
});

// Process the check status form.
app.post('/check-status', async (req, res) => {
  const { cin, transaction_number } = req.body;
  if (!cin || !transaction_number) {
    return res.render('check-status', {
      title: 'التحقق من الحالة',
      error: 'الرجاء إدخال جميع الحقول المطلوبة',
      formData: req.body
    });
  }
  try {
    const [results] = await connection.query(
      `SELECT s.*, r.statut
       FROM services_utilisateur s
       LEFT JOIN results r ON s.cin = r.cin AND s.sujet = r.sujet
       WHERE s.cin = ? AND s.numero_transaction = ?`,
      [cin, transaction_number]
    );
    if (!results.length) {
      return res.render('check-status', {
        title: 'التحقق من الحالة',
        error: 'لم يتم العثور على نتائج مطابقة',
        formData: req.body
      });
    }
    res.render('check-status', { title: 'التحقق من الحالة', result: results[0], error: null });
  } catch (err) {
    console.error('Check status error:', err.message);
    res.render('check-status', {
      title: 'التحقق من الحالة',
      error: 'حدث خطأ في النظام',
      formData: req.body
    });
  }
});

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).render('error', { message: 'حدث خطأ غير متوقع', error: IS_PROD ? {} : err });
});

// 404 handler.
app.use((req, res) => {
  res.status(404).render('error', { message: 'الصفحة غير موجودة', error: { status: 404 } });
});

// --- Start the Server ---
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
