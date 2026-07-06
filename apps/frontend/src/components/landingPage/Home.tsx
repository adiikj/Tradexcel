import React from 'react';
import Card from './Card';
import Banner from './Banner';
import person from '../../assets/person.png';
import Newsletter from './Newsletter';
import Link from "next/link";
import card1 from '../../assets/card1.png';
import card2 from '../../assets/card2.png';
import card3 from '../../assets/card3.png';
import banner2 from '../../assets/banner2.png';
import dashboard from "../../assets/dashboard.png";
import dashboard2 from "../../assets/dashboard2.png";
import { motion } from 'framer-motion';
import { FiUserPlus, FiDollarSign, FiActivity, FiAward, FiStar, FiCheck, FiTrendingUp, FiArrowRight, FiPlayCircle } from "react-icons/fi";

const stats = [
  { value: "₹1,00,000", label: "Virtual cash to start" },
  { value: "Real-time", label: "Live market prices" },
  { value: "50+", label: "Stocks to trade" },
  { value: "₹0", label: "Real-money risk" },
];

const steps = [
  { icon: FiUserPlus, title: "Sign up free", desc: "Create your account in under a minute, no payment details needed." },
  { icon: FiDollarSign, title: "Get virtual cash", desc: "Your wallet is instantly funded with ₹1,00,000 to invest." },
  { icon: FiActivity, title: "Trade live stocks", desc: "Buy and sell at real market prices and track your portfolio." },
  { icon: FiAward, title: "Climb the ranks", desc: "Compete in contests and rise up the Tradexcel leaderboard." },
];

const testimonials = [
  { quote: "I finally understand how the market moves without risking my savings. The leaderboard makes it addictive.", name: "Aarav Sharma", role: "Student investor" },
  { quote: "Tradexcel is the easiest way I've found to practise trading. Clean, fast, and the real-time prices feel legit.", name: "Priya Nair", role: "First-time trader" },
  { quote: "The contests turned my casual practice into a real competition. I check my portfolio every morning now.", name: "Rohan Mehta", role: "Hobby trader" },
];

function Home() {
  return (
    <>
      {/* Hero Section */}
      <motion.div
        className="motion-container w-full pt-20 pb-16 md:py-12 flex flex-col md:flex-row md:items-center bg-grey relative md:min-h-[calc(100vh-5rem)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* decorative background accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-blue-100/60 blur-3xl" />
        </div>

        {/* Left Side (Text) */}
        <motion.div
          className="relative z-10 h-auto w-full md:w-1/2 pl-6 md:pl-12 lg:pl-20 p-6 pt-12 pb-0"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-blue-500 font-pop text-xl">Master Virtual Trading</div>
          <div className="py-4 font-pop font-semibold text-4xl md:text-4xl lg:text-5xl !leading-[1.3] text-balance">
            Learn, Trade, and Compete in a <span className="text-blue-500">Realistic Stock Market Simulation</span>
          </div>
          <div className="text-gray-600 text-xl">Experience the thrill of trading without the risk. Build your portfolio, track performance, and rise to the top of the leaderboard!</div>
          <div className="pt-10 flex flex-col sm:flex-row gap-4 sm:gap-5">
            <Link href="/signup" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-semibold text-white text-base bg-btn-blue hover:bg-blue-600 transition-colors duration-200"
              >
                Get Started
                <FiArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
              </motion.button>
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-semibold text-base border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200"
              >
                <FiPlayCircle className="text-lg text-blue-500" />
                How it Works?
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Right Side (Dashboard Image) */}
        <motion.div
          className="relative z-10 w-full md:w-1/2 flex justify-center items-center py-12 md:py-0 px-4 md:pr-10 lg:pr-16"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hidden sm:block relative w-full aspect-[3/2]">
            <img
              src={((dashboard)?.src || (dashboard)) as string}
              alt="Dashboard dark mode"
              className="absolute top-0 left-0 z-0 hover:z-20 w-[85%] h-auto object-cover border-2 rounded-2xl border-btn-blue shadow-xl transition-transform duration-300 hover:scale-[1.02]"
            />
            <img
              src={((dashboard2)?.src || (dashboard2)) as string}
              alt="Dashboard light mode"
              className="absolute bottom-0 right-0 z-10 hover:z-20 w-[85%] h-auto object-cover border-2 rounded-2xl border-btn-blue shadow-xl transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Stats Strip */}
      <motion.div
        className="w-full bg-btn-blue text-white px-6 md:px-16 lg:px-24 py-12 rounded-t-[2.5rem] relative z-10 shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.15)]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-semibold font-pop">{s.value}</div>
              <div className="text-blue-100 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Why Choose Tradexcel Section */}
      <motion.div
        className="bg-white w-full h-auto p-6 sm:p-10 md:p-12 lg:p-20 lg:pb-10 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h6 className="text-blue-500 font-pop text-2xl font-semibold">Why You Should Choose Tradexcel?</h6>
        <p className="text-3xl md:text-3xl pt-4 font-semibold font-pop">Master trading with real-time insights!</p>
        <div className="gap-6 md:gap-10 mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card img={card1} heading="Risk-Free Learning" description="Tradexcel offers a safe environment for learning to trade. Practice without real money while developing confidence and refining your trading skills effectively." />
          <Card img={card2} heading="Engaging Experience" description="Our platform combines competition and gamification. With leaderboards, achievements, and real-time updates, trading becomes exciting and rewarding for every participant." />
          <Card img={card3} heading="User-Friendly Design" description="We prioritize simplicity and efficiency. Navigate seamlessly, access real-time data, and utilize interactive tools tailored to both beginners and seasoned traders." />
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        className="bg-grey w-full px-6 md:px-16 lg:px-24 py-16 md:py-20 text-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h6 className="text-blue-500 font-pop text-lg font-semibold">Getting started</h6>
        <p className="text-3xl md:text-4xl pt-2 font-semibold font-pop">
          Start trading in 4 simple steps
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-left relative"
              >
                <span className="absolute top-6 right-6 text-5xl font-bold font-pop text-blue-50">
                  {i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 text-2xl">
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold font-pop mt-5">{s.title}</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
        <Link href="/how-it-works">
          <button className="mt-12 px-10 py-4 rounded-lg bg-btn-blue text-white text-sm font-medium">
            See How It Works
          </button>
        </Link>
      </motion.div>

      {/* Banner Section */}
      <motion.div
        className="w-full bg-white py-0 md:pb-24 px-6 sm:px-12 md:p-0 lg:px-20"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Banner
          img={person}
          heading="Real-Time Stock Simulation"
          description="Trade live with updated stock prices and dynamic market conditions. Build and manage portfolios, experience realistic fluctuations, and enhance your skills in an interactive environment. Our real-time features replicate actual stock market scenarios, offering a comprehensive and engaging virtual trading experience."
        />
        <Banner
          img={banner2}
          heading="Advanced Analytics and Insights"
          description="Access detailed stock charts, performance metrics, and intuitive data visualizations. Evaluate market trends, monitor portfolio performance, and identify growth opportunities. Our analytics tools empower users to make data-driven decisions and refine their trading strategies for maximum effectiveness and deeper market understanding."
          reverse={true}
        />
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        className="bg-grey w-full px-6 md:px-16 lg:px-24 py-16 md:py-20 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h6 className="text-blue-500 font-pop text-lg font-semibold">Loved by new traders</h6>
        <p className="text-3xl md:text-4xl pt-2 font-semibold font-pop">
          People are learning faster with Tradexcel
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-8 text-left flex flex-col"
            >
              <div className="flex gap-1 text-blue-500">
                {Array.from({ length: 5 }).map((_, j) => (
                  <FiStar key={j} className="fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mt-4 flex-1">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 font-semibold font-pop flex items-center justify-center">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold font-pop text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Final CTA Section */}
      <motion.div
        className="w-full bg-btn-blue text-white text-center px-6 md:px-16 lg:px-24 py-16 md:py-20"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="max-w-3xl mx-auto">
          <h6 className="text-blue-100 font-pop text-lg font-semibold flex items-center justify-center gap-2">
            <FiTrendingUp /> Start trading in minutes
          </h6>
          <p className="text-3xl md:text-4xl pt-2 font-semibold font-pop">
            Ready to build your portfolio?
          </p>
          <p className="text-blue-100 text-lg mt-4 max-w-2xl mx-auto">
            Join Tradexcel today and start trading real stocks with virtual money. No risk, all
            the reward of learning.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
            <Link href="/signup">
              <button className="w-full sm:w-auto border-2 px-10 font-medium py-4 rounded-lg bg-white border-transparent text-btn-blue text-sm">
                Get Started Free
              </button>
            </Link>
            <Link href="/why-us">
              <button className="w-full sm:w-auto border-2 px-10 py-4 rounded-lg text-white border-white text-sm">
                Why Tradexcel?
              </button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-blue-100 text-sm">
            <span className="flex items-center gap-1.5"><FiCheck /> Free forever</span>
            <span className="flex items-center gap-1.5"><FiCheck /> No credit card</span>
            <span className="flex items-center gap-1.5"><FiCheck /> Virtual money only</span>
          </div>
        </div>
      </motion.div>

      {/* Newsletter Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Newsletter />
      </motion.div>
    </>
  );
}

export default Home;
