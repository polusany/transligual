'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        'http://localhost:4000/api/v1/courses',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            title,
            description,
            language,
            level,
          }),
        }
      );


      if (!response.ok) {
        throw new Error('Failed to create course');
      }


      setMessage('Course created successfully!');

      setTitle('');
      setDescription('');
      setLanguage('');
      setLevel('');


      setTimeout(() => {
        router.push('/courses');
      }, 1000);


    } catch (error) {

      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <main className="page-shell">

      <section>

        <p className="eyebrow">
          INSTRUCTOR PANEL
        </p>


        <h1>
          Create New Course
        </h1>


        <form onSubmit={handleSubmit}>


          <label>
            Course Title

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Example: English Grammar"
              required
            />

          </label>



          <label>
            Description

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe your course"
              rows={5}
            />

          </label>



          <label>
            Language

            <input
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value)
              }
              placeholder="Example: French"
              required
            />

          </label>



          <label>
            Level

            <select
              value={level}
              onChange={(e) =>
                setLevel(e.target.value)
              }
              required
            >

              <option value="">
                Select level
              </option>

              <option value="Beginner">
                Beginner
              </option>

              <option value="Intermediate">
                Intermediate
              </option>

              <option value="Advanced">
                Advanced
              </option>

            </select>

          </label>



          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? 'Creating...'
              : 'Create Course'}

          </button>


        </form>


        {message && (
          <p>
            {message}
          </p>
        )}


      </section>

    </main>
  );
}