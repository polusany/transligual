'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, CurrentUser } from '../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('transligual.accessToken');

    if (!token) {
      setError('Sign in to see your learning space.');
      return;
    }

    apiRequest<CurrentUser>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(setUser)
      .catch((caught) => {
        sessionStorage.removeItem('transligual.accessToken');

        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to load your account.'
        );
      });
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('transligual.accessToken');
    window.location.href = '/login';
  };

  if (error) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <p className="eyebrow">STUDENT DASHBOARD</p>

          <h1>Your learning space</h1>

          <p className="form-error">{error}</p>

          <Link href="/login" className="primary-button">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-card">
          <p className="eyebrow">STUDENT DASHBOARD</p>

          <h1>Your learning space</h1>

          <p>Loading your account...</p>
        </section>
      </main>
    );
  }

  const name =
    user.profile?.displayName ||
    user.profile?.firstName ||
    'Learner';

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <header className="dashboard-nav">

        <div className="brand">
          <span className="brand-main">Trans</span>
          <span className="brand-accent">lingual</span>
        </div>

        <div className="nav-user">
          <span>{name}</span>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>

      </header>


      {/* WELCOME */}

      <section className="welcome-section">

        <p className="eyebrow">
          STUDENT DASHBOARD
        </p>

        <h1>
          Bonjour, {name} 👋
        </h1>

        <p>
          Continue your language learning journey and
          keep making progress every day.
        </p>

      </section>


      {/* COURSE STATISTICS */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-number">
            0
          </span>

          <span className="stat-label">
            My Courses
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-number">
            0
          </span>

          <span className="stat-label">
            In Progress
          </span>

        </div>


        <div className="stat-card">

          <span className="stat-number">
            0
          </span>

          <span className="stat-label">
            Completed
          </span>

        </div>

      </section>


      {/* MY COURSES */}

      <section className="courses-section">

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              LEARNING
            </p>

            <h2>
              My Courses
            </h2>

          </div>


          <Link
            href="/courses"
            className="browse-button"
          >
            Browse Courses
          </Link>

        </div>


        {/* EMPTY COURSE STATE */}

        <div className="empty-courses">

          <div className="empty-icon">
            📚
          </div>

          <h3>
            No courses yet
          </h3>

          <p>
            You haven't enrolled in any courses yet.
            Browse our available courses and start learning.
          </p>

          <Link
            href="/courses"
            className="primary-button"
          >
            Browse Courses
          </Link>

        </div>

      </section>

    </main>
  );
}