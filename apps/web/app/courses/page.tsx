import Link from 'next/link';

type Course = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  level: string;
  thumbnail: string | null;
};

async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetch(
      'http://localhost:4000/api/v1/courses',
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    return response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <header className="dashboard-nav">

        <div className="brand">
          <span className="brand-main">
            Trans
          </span>

          <span className="brand-accent">
            lingual
          </span>
        </div>


        <Link
          href="/dashboard"
          className="browse-button"
        >
          Dashboard
        </Link>

      </header>


      {/* TITLE */}

      <section className="welcome-section">

        <p className="eyebrow">
          COURSE LIBRARY
        </p>

        <h1>
          Browse Courses
        </h1>

        <p>
          Explore available language courses and
          start your learning journey.
        </p>

      </section>


      {/* COURSES */}

      {courses.length === 0 ? (

        <section className="courses-section">

          <div className="empty-courses">

            <div className="empty-icon">
              📚
            </div>

            <h3>
              No courses available yet
            </h3>

            <p>
              New courses will appear here once
              instructors publish them.
            </p>

          </div>

        </section>

      ) : (

        <section className="stats-grid">

          {courses.map((course) => (

            <div
              key={course.id}
              className="stat-card"
            >

              <h2>
                {course.title}
              </h2>

              <p>
                {course.description}
              </p>

              <p>
                Language: {course.language}
              </p>

              <p>
                Level: {course.level}
              </p>


              <Link
                href={`/courses/${course.id}`}
                className="primary-button"
              >
                View Course
              </Link>

            </div>

          ))}

        </section>

      )}

    </main>
  );
}