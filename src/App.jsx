import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/common';
import MainLayout from './layouts/MainLayout';
import AuditorLayout from './layouts/AuditorLayout';
import Landing from './pages/Landing'; // Keep Landing eager for LCP

// Lazy Load Pages to optimize bundle size
const Auth = React.lazy(() => import('./pages/Auth'));

const Income = React.lazy(() => import('./pages/Income'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Budgets = React.lazy(() => import('./pages/Budgets'));
const Accounts = React.lazy(() => import('./pages/Accounts'));
const PlannedPayments = React.lazy(() => import('./pages/PlannedPayments'));
const Savings = React.lazy(() => import('./pages/Savings'));
const Investments = React.lazy(() => import('./pages/Investments'));
const Debts = React.lazy(() => import('./pages/Debts'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Transfers = React.lazy(() => import('./pages/finance/Transfers'));
const FinanceAccounts = React.lazy(() => import('./pages/finance/Accounts'));
const Bills = React.lazy(() => import('./pages/finance/Bills'));
const FinanceSavings = React.lazy(() => import('./pages/finance/Savings'));
const Rewards = React.lazy(() => import('./pages/finance/Rewards'));
const Books = React.lazy(() => import('./pages/Books'));
const BooksDashboard = React.lazy(() => import('./pages/books/Dashboard'));
const Auditor = React.lazy(() => import('./pages/Auditor'));
const Public = React.lazy(() => import('./pages/Public'));
const Stock = React.lazy(() => import('./pages/Stock'));
const FinancialPlan = React.lazy(() => import('./pages/financial-plan/FinancialPlan'));
const PlanBudget = React.lazy(() => import('./pages/financial-plan/PlanBudget'));
const PlanIncome = React.lazy(() => import('./pages/financial-plan/PlanIncome'));
const PlanExpense = React.lazy(() => import('./pages/financial-plan/PlanExpense'));
const FinancialCalendar = React.lazy(() => import('./pages/financial-plan/FinancialCalendar'));
const PlanGoals = React.lazy(() => import('./pages/financial-plan/PlanGoals'));
const PlanReminders = React.lazy(() => import('./pages/financial-plan/PlanReminders'));
const PlanAnalysis = React.lazy(() => import('./pages/financial-plan/PlanAnalysis'));
const People = React.lazy(() => import('./pages/People'));
const PeopleOverview = React.lazy(() => import('./pages/people/PeopleOverview'));
const PeopleTransactions = React.lazy(() => import('./pages/people/PeopleTransactions'));
const PeopleReminders = React.lazy(() => import('./pages/people/PeopleReminders'));
const PeopleRecords = React.lazy(() => import('./pages/people/PeopleRecords'));
const PersonProfile = React.lazy(() => import('./pages/people/PersonProfile'));

const Segregation = React.lazy(() => import('./pages/Segregation'));
const SplitExpense = React.lazy(() => import('./pages/SplitExpense'));
const GoalWallets = React.lazy(() => import('./pages/GoalWallets'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const FAQ = React.lazy(() => import('./pages/FAQ'));

import './App.css';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px', color: '#64748B' }}>
    Loading...
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={
              <Suspense fallback={<PageLoader />}>
                <Auth />
              </Suspense>
            } />
            <Route path="/auditor" element={
              <Suspense fallback={<PageLoader />}>
                <AuditorLayout>
                  <Auditor />
                </AuditorLayout>
              </Suspense>
            } />
            <Route path="/books/profile" element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            } />

            {/* Protected Routes - All routes within MainLayout require authentication */}
            <Route path="*" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <MainLayout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Finance (formerly Home) Section */}
                        <Route path="/finance" element={<Finance />} />
                        <Route path="/finance/income" element={<Income />} />
                        <Route path="/finance/expenses" element={<Expenses />} />
                        <Route path="/finance/budgets" element={<Budgets />} />
                        <Route path="/finance/accounts" element={<Accounts />} />
                        <Route path="/finance/transactions" element={<Transactions />} />
                        <Route path="/finance/planned-payments" element={<PlannedPayments />} />
                        <Route path="/finance/savings" element={<Savings />} />
                        <Route path="/finance/investments" element={<Investments />} />
                        <Route path="/finance/debts" element={<Debts />} />



                        {/* Books Section */}
                        <Route path="/books" element={<Books />} />
                        <Route path="/books/dashboard" element={<BooksDashboard />} />
                        <Route path="/books/stock" element={<Stock />} />
                        <Route path="/books/financial-plan" element={<FinancialPlan />} />
                        <Route path="/books/plan/budget" element={<PlanBudget />} />
                        <Route path="/books/plan/income" element={<PlanIncome />} />
                        <Route path="/books/plan/expense" element={<PlanExpense />} />
                        <Route path="/books/plan/calendar" element={<FinancialCalendar />} />
                        <Route path="/books/plan/goals" element={<PlanGoals />} />
                        <Route path="/books/plan/reminders" element={<PlanReminders />} />
                        <Route path="/books/plan/analysis" element={<PlanAnalysis />} />
                        <Route path="/books/people" element={<People />} />
                        <Route path="/books/people/overview" element={<PeopleOverview />} />
                        <Route path="/books/people/:id" element={<PersonProfile />} />
                        <Route path="/books/people/transactions" element={<PeopleTransactions />} />
                        <Route path="/books/people/reminders" element={<PeopleReminders />} />
                        <Route path="/books/people/records" element={<PeopleRecords />} />

                        <Route path="/books/segregation" element={<Segregation />} />
                        <Route path="/books/split-expense" element={<SplitExpense />} />
                        <Route path="/books/goal-wallets" element={<GoalWallets />} />
                        <Route path="/books/settings" element={<Settings />} />
                        <Route path="/books/faq" element={<FAQ />} />

                        {/* Public Section */}
                        <Route path="/public" element={<Public />} />
                      </Routes>
                    </Suspense>
                  </MainLayout>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider >
  );
}

export default App;


