"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Later you can send this data to your API
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="px-6 py-10 text-center text-red-500">
        <h1 className="text-4xl font-bold md:text-5xl">Contact Us</h1>

        <p className="mx-auto mt-4 max-w-2xl text-red-400">
          Have a question, feedback, or want to make a reservation? We would
          love to hear from you.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
        {/* Contact Information */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>

          <p className="mt-4 leading-7 text-gray-600">
            Visit us for delicious food and a great dining experience. You can
            also reach us using the information below.
          </p>

          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <div className="text-2xl">📍</div>

              <div>
                <h3 className="font-semibold text-gray-900">Address</h3>

                <p className="mt-1 text-gray-600">
                  Spinks World, Pace City - II
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">📞</div>

              <div>
                <h3 className="font-semibold text-gray-900">Phone</h3>

                <p className="mt-1 text-gray-600">+91 98745 56321</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">✉️</div>

              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>

                <p className="mt-1 text-gray-600">info@spinksworld.com</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">🕐</div>

              <div>
                <h3 className="font-semibold text-gray-900">Opening Hours</h3>

                <p className="mt-1 text-gray-600">11:00 AM - 11:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Send Us a Message
          </h2>

          {submitted ? (
            <div className="mt-8 rounded-lg bg-green-50 p-5 text-green-700">
              <h3 className="font-semibold">Message Sent Successfully!</h3>

              <p className="mt-1 text-sm">
                Thank you for contacting us. We will get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Your Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Write your message..."
                  required
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
