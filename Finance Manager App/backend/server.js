const net = require('net');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { initDatabase } = require('./database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { sendSuccess } = require('./utils/response');
const swaggerSpec = require('./swagger');

const expensesRoutes = require('./routes/expenses');
const incomesRoutes = require('./routes/incomes');
const budgetsRoutes = require('./routes/budgets');
const dashboardRoutes = require('./routes/dashboard');
const savingsGoalRoutes = require('./routes/savingsGoal');

const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 3458;
const MAX_PORT_ATTEMPTS = 50;

function findAvailablePort(preferredPort, attemptsLeft = MAX_PORT_ATTEMPTS) {
  return new Promise((resolve, reject) => {
    if (attemptsLeft <= 0) {
      reject(new Error(`No free port found between ${preferredPort} and ${preferredPort + MAX_PORT_ATTEMPTS - 1}`));
      return;
    }

    const tester = net.createServer();
    tester.unref();

    tester.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(findAvailablePort(preferredPort + 1, attemptsLeft - 1));
        return;
      }
      reject(error);
    });

    tester.listen(preferredPort, () => {
      const { port } = tester.address();
      tester.close(() => resolve(port));
    });
  });
}

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/expenses', expensesRoutes);
app.use('/api/incomes', incomesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/savings-goal', savingsGoalRoutes);

app.get('/', (req, res) => {
  sendSuccess(res, { message: 'Finance Manager API is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initDatabase();

    const port = await findAvailablePort(PREFERRED_PORT);

    app.listen(port, () => {
      if (port !== PREFERRED_PORT) {
        console.log(`Port ${PREFERRED_PORT} was busy — using ${port} instead.`);
      }
      console.log(`Finance Manager API listening on http://localhost:${port}`);
      console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
