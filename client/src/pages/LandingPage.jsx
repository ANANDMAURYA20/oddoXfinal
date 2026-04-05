import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  BarChart3, 
  Users, 
  QrCode, 
  ShoppingBag, 
  Smartphone, 
  ArrowRight, 
  Check, 
  Star, 
  Plus, 
  Minus,
  MessageSquare,
  Zap,
  Globe,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BRAND_ORANGE = '#FF6B1A';
const DARK_BG = '#111111';
const LIGHT_BG = '#F2F2F5';

const FadeUp = ({ children, delay = 0, duration = 0.5 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <ChefHat size={24} />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-slate-900">OddoPOS</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Home', 'Features', 'Pricing', 'Testimonials', 'FAQ'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-orange-600 px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-200 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, x: 20 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    transition={{ delay, duration: 0.6 }}
    className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100 min-w-[180px]"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  </motion.div>
);

const Hero = () => {
  return (
    <section id="home" className="pt-32 pb-20 px-6 bg-[#F2F2F5] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[3rem] bg-[#111111] p-12 md:p-20 overflow-hidden shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-600/10 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-orange-400 text-xs font-bold mb-6 tracking-wider uppercase">
                  <Zap size={14} className="fill-orange-400" /> All-in-one Solution
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
                  Manage your restaurant business <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">so advanced</span>
                </h1>
                <p className="text-lg text-slate-400 mb-10 max-w-lg">
                  The ultimate POS system for modern restaurants. Streamline orders, manage inventory, and track sales in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="group bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
                    Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-white/10 transition-all">
                    Watch Demo
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative z-20"
              >
                {/* Dashboard Previews - using placeholders for now if generator path is complex, but user requested Exact matches */}
                <img 
                  src="/pos_dashboard_preview.png" 
                  alt="POS Dashboard Mockup" 
                  className="rounded-2xl shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-700"
                />
              </motion.div>

              {/* Floating Stat Cards */}
              <div className="absolute -top-10 -right-10 z-30 hidden lg:block">
                <StatCard 
                  icon={BarChart3} 
                  label="Sales Stats" 
                  value="+42.5%" 
                  color="bg-blue-600" 
                  delay={0.6}
                />
              </div>
              <div className="absolute top-1/2 -left-20 z-30 hidden lg:block">
                <StatCard 
                  icon={Star} 
                  label="Rating" 
                  value="4.9 / 5.0" 
                  color="bg-amber-500" 
                  delay={0.8}
                />
              </div>
              <div className="absolute -bottom-10 right-1/4 z-30 hidden lg:block">
                <StatCard 
                  icon={Users} 
                  label="Total Partners" 
                  value="50k+" 
                  color="bg-emerald-600" 
                  delay={1.0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="mt-20">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">
            Trusted by over 50,000 restaurants in 70+ countries
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {['McDonalds', 'PizzaHut', 'Starbucks', 'KFC', 'BurgerKing'].map((brand) => (
              <div key={brand} className="text-2xl font-black text-slate-900 tracking-tighter">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, image, dark = false }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className={`p-8 rounded-[2.5rem] shadow-sm border transition-all ${
      dark ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-100'
    }`}
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
      dark ? 'bg-orange-600 text-white shadow-orange-900/50' : 'bg-orange-50 text-orange-600'
    }`}>
      <Icon size={28} />
    </div>
    <h3 className={`text-2xl font-bold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    <p className={`mb-8 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
    {image && (
      <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 shadow-xl">
        <img src={image} alt={title} className="w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
      </div>
    )}
  </motion.div>
);

const Features = () => {
  return (
    <section id="features" className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-20">
          <FadeUp>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              Complementary features for your business needs
            </h2>
            <p className="text-lg text-slate-500">
              Everything you need to run a successful restaurant, from order tracking to advanced sales analytics.
            </p>
          </FadeUp>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="space-y-8 md:mt-20">
            <FeatureCard 
              icon={ShoppingBag} 
              title="Order Management" 
              description="Monitor orders in real-time, tailor orders to customer preferences and improve service speed."
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Sales Analytics" 
              description="Get in-depth insights into your performance. See popular items, track trends and boost revenue."
              dark
            />
          </div>
          
          <div className="space-y-8">
            <FeatureCard 
              icon={QrCode} 
              title="QR Menu Integration" 
              description="Enable customers to order directly from their table with our seamless QR menu system."
            />
            <div className="bg-orange-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <ChefHat size={40} className="mb-6 opacity-80" />
                <h3 className="text-3xl font-bold mb-4">Kitchen Display System</h3>
                <p className="opacity-90 mb-8 text-sm">Real-time sync between POS and Kitchen. Eliminate Paper KOTs.</p>
                <button className="flex items-center gap-2 text-sm font-bold bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                  Learn More <ArrowRight size={16} />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            </div>
            <FeatureCard 
              icon={ShieldCheck} 
              title="Inventory Tracking" 
              description="Never run out of ingredients. Automated low-stock alerts and advanced tracking."
            />
          </div>

          <div className="space-y-8 md:mt-10">
            <FeatureCard 
              icon={Users} 
              title="Staff Management" 
              description="Track shifts, manage permissions and monitor employee performance with ease."
              dark
            />
            <FeatureCard 
              icon={Smartphone} 
              title="Multi-Outlet Support" 
              description="Manage multiple locations from a single dashboard. Synchronized menus and reports."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ComparisonTable = () => {
  const plans = [
    { name: 'Basic', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', accent: 'bg-emerald-500' },
    { name: 'Pro', color: 'bg-blue-50 text-blue-700 border-blue-100', accent: 'bg-blue-500', popular: true },
    { name: 'Enterprise', color: 'bg-purple-50 text-purple-700 border-purple-100', accent: 'bg-purple-500' },
  ];

  const rows = [
    'Order Management',
    'Inventory Tracking',
    'Staff Management',
    'Sales Analytics',
    'QR Menu Ordering',
    'API Access',
    'Multi-Outlet Sync',
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-[#F2F2F5]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <FadeUp>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 underline decoration-orange-600/30 decoration-8 underline-offset-8">
              Compare our plans
            </h2>
          </FadeUp>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px] bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-4 text-left font-bold text-slate-400 uppercase tracking-widest text-xs">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="p-4">
                      <div className={`rounded-2xl p-6 text-center border transition-all ${plan.color}`}>
                        {plan.popular && <span className="text-[10px] uppercase tracking-tighter font-black mb-2 block opacity-70 italic">Most Popular</span>}
                        <h4 className="text-3xl font-black mb-2 leading-none uppercase">{plan.name}</h4>
                        <div className="w-8 h-1 bg-current mx-auto opacity-20 rounded-full mb-4 md:block hidden" />
                        <button className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-lg ${plan.accent}`}>Select</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, i) => (
                  <tr key={row} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-semibold text-slate-700">{row}</td>
                    {[0, 1, 2].map((col) => (
                      <td key={col} className="p-6 text-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          (col === 0 && i < 4) || (col === 1 && i < 6) || col === 2
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-slate-100 text-slate-300'
                        }`}>
                          <Check size={18} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ quote, author, role, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-full ${color}`}
  >
    <div>
      <MessageSquare size={32} className="mb-6 opacity-20" />
      <p className="text-xl font-medium text-slate-800 leading-relaxed italic">
        "{quote}"
      </p>
    </div>
    <div className="mt-10 flex items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-slate-400">
        {author[0]}
      </div>
      <div>
        <p className="font-bold text-slate-900">{author}</p>
        <p className="text-sm text-slate-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6">
              Loved by restaurant owners
            </h2>
            <p className="text-lg text-slate-500">
              See how OddoPOS is transforming operations for busy restaurants everywhere.
            </p>
          </div>
          <div className="hidden md:flex gap-4 mt-8">
            <button className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ChevronRight size={24} className="rotate-180" />
            </button>
            <button className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-orange-600 transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="We are very impressed with the use of this POS application. Management of orders and payments becomes faster."
            author="Stefano William"
            role="CEO of Pizza Hut"
            color="bg-[#E9F7EF]"
          />
          <TestimonialCard 
            quote="The use of this application has given our company efficiency and accuracy in managing orders and payments."
            author="Jennifer Lopez"
            role="Owner of KFC"
            color="bg-[#EEF2FF]"
          />
          <TestimonialCard 
            quote="We are pleased with the flexibility of this company's POS application. We can easily adapt our menu and prices."
            author="Emanuel Rodrigo"
            role="Product Owner McDonald's"
            color="bg-[#FFF4ED]"
          />
        </div>
      </div>
    </section>
  );
};

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className={`border-b border-slate-100 transition-all ${isOpen ? 'pb-6 pt-2' : 'py-6'}`}>
    <button 
      onClick={onClick}
      className="flex items-center justify-between w-full text-left group"
    >
      <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-orange-600' : 'text-slate-800'}`}>
        {question}
      </span>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-orange-600 text-white rotate-45' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
        <Plus size={18} />
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <p className="mt-4 text-slate-500 leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const categories = ['General', 'Transactions', 'Payment', 'Others'];

  return (
    <section id="faq" className="py-32 px-6 bg-[#F2F2F5]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid md:grid-cols-12 gap-16">
            <div className="md:col-span-4">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-10 leading-[1.1]">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {categories.map((cat, i) => (
                  <button 
                    key={cat}
                    className={`block w-full text-left px-6 py-3 rounded-xl font-bold transition-all ${
                      i === 0 ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-8">
              <FAQItem 
                question="What are the common features in the OddoPOS system?"
                answer="Common features include order management, payment integration, stock management, sales reporting, data analysis, table management, and customer support."
                isOpen={openIndex === 0}
                onClick={() => setOpenIndex(openIndex === 0 ? -1 : 0)}
              />
              <FAQItem 
                question="How does OddoPOS help in managing stock?"
                answer="OddoPOS provides real-time inventory tracking, automatic low-stock alerts, and detailed reports on ingredient usage to help minimize waste and optimize ordering."
                isOpen={openIndex === 1}
                onClick={() => setOpenIndex(openIndex === 1 ? -1 : 1)}
              />
              <FAQItem 
                question="Can the POS application be integrated with other systems?"
                answer="Yes, our system offers robust API access and built-in integrations for popular third-party tools like accounting software, online ordering platforms, and payment gateways."
                isOpen={openIndex === 2}
                onClick={() => setOpenIndex(openIndex === 2 ? -1 : 2)}
              />
              <FAQItem 
                question="What is the average cost to purchase and implement?"
                answer="Pricing varies by plan. Our Basic plan starts with a low monthly fee, while Pro and Enterprise plans offer more advanced features for larger operations. Setup is usually quick and simple."
                isOpen={openIndex === 3}
                onClick={() => setOpenIndex(openIndex === 3 ? -1 : 3)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[4rem] bg-[#111111] p-12 md:p-24 overflow-hidden relative shadow-2xl">
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] border border-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] border border-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
                Don't Miss This Exclusive Opportunity
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-md font-medium">
                Enter your email address and start connecting with a better business world using our POS products.
              </p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md">
                <input 
                  type="email" 
                  placeholder="name@email.com" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button className="bg-orange-600 text-white px-8 py-4 rounded-full font-bold hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
                  Try for Free <ArrowRight size={20} />
                </button>
              </form>
            </div>
            
            <div className="relative md:block hidden">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative z-20"
              >
                 <img 
                  src="/pos_mobile_app.png" 
                  alt="POS Showcase" 
                  className="rounded-2xl shadow-2xl rotate-3 scale-110"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                <ChefHat size={18} />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight underline decoration-orange-600 decoration-4 underline-offset-4">OddoPOS</span>
            </div>
            <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
              Empowering restaurants with the next generation of POS technology. Simple, powerful, and mobile-ready.
            </p>
            <div className="flex gap-4">
              {['fb', 'tw', 'ln', 'ig'].map(s => (
                <div key={s} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all cursor-pointer">
                  <Globe size={18} />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-orange-600 transition-all cursor-pointer">POS Machine</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">KDS System</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">QR Menu</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Features</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-orange-600 transition-all cursor-pointer">Inventory</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Staffing</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Reports</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">CRM</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-orange-600 transition-all cursor-pointer">Documentation</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Help Center</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Privacy</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Terms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-orange-600 transition-all cursor-pointer">About Us</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Blog</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Careers</li>
                <li className="hover:text-orange-600 transition-all cursor-pointer">Contact</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-50 pt-8 mt-10">
          <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} OddoXindus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="font-body selection:bg-orange-100 selection:text-orange-700">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ComparisonTable />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
