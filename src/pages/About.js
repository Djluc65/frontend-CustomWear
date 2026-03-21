import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaMagic, FaLeaf, FaLightbulb } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './About.css';

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.18 } }
};

const itemVariants = {
  hidden:  { y: 24, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.5 } }
};

const values = [
  {
    icon: <FaHeart />,
    title: "Passion & Qualité",
    description:
      "Chaque produit est imprimé et vérifié avec soin dans notre atelier parisien pour garantir une qualité irréprochable."
  },
  {
    icon: <FaMagic />,
    title: "Créativité Sans Limite",
    description:
      "Nos outils de personnalisation vous donnent le pouvoir de créer des pièces uniques qui vous ressemblent vraiment."
  },
  {
    icon: <FaLeaf />,
    title: "Responsabilité",
    description:
      "Nous privilégions des matériaux durables et des processus d'impression respectueux de l'environnement."
  },
  {
    icon: <FaLightbulb />,
    title: "Innovation",
    description:
      "Nous cherchons constamment de nouvelles techniques pour repousser les limites de la personnalisation textile."
  }
];

const About = () => (
  <div className="about-page">

    {/* ── Hero ── */}
    <motion.div
      className="about-hero"
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75 }}
    >
      <h1>À Propos de CustomWear</h1>
      <p>L'art de la personnalisation, au service de votre style.</p>
    </motion.div>

    {/* ── Notre Histoire ── */}
    <motion.div
      className="about-section"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="about-grid">
        <motion.div className="about-content" variants={itemVariants}>
          <h2>Notre Histoire</h2>
          <p>
            Née au cœur de Paris, CustomWear a commencé avec une idée simple : permettre à chacun
            d'exprimer sa créativité à travers ses vêtements.
          </p>
          <p>
            Ce qui n'était au départ qu'un petit atelier de passionnés est devenu une référence dans
            l'impression textile personnalisée. Nous croyons que chaque vêtement raconte une histoire,
            et nous sommes là pour vous aider à écrire la vôtre.
          </p>
          <p>
            Que vous soyez un artiste souhaitant lancer sa marque, une entreprise cherchant à renforcer
            son identité, ou simplement quelqu'un qui veut un t-shirt unique, nous mettons notre
            expertise à votre service.
          </p>
        </motion.div>

        <motion.div className="about-image" variants={itemVariants}>
          <img
            src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Atelier CustomWear"
            loading="lazy"
          />
        </motion.div>
      </div>
    </motion.div>

    {/* ── Nos Valeurs ── */}
    <motion.div
      className="about-section"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <h2 className="about-section-title">Nos Valeurs</h2>

      <div className="values-grid">
        {values.map((value, index) => (
          <motion.div
            key={index}
            className="value-card"
            variants={itemVariants}
          >
            <div className="value-icon">{value.icon}</div>
            <h3>{value.title}</h3>
            <p>{value.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* ── CTA ── */}
    <motion.div
      className="cta-section"
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <h2>Prêt à Créer ?</h2>
      <p>
        Laissez libre cours à votre imagination et créez votre premier produit
        personnalisé dès aujourd'hui.
      </p>

      <div className="cta-buttons">
        <Link to="/customize" className="ab-btn-primary">
          Commencer à Personnaliser
        </Link>
        <Link to="/products" className="ab-btn-outline">
          Voir Nos Produits
        </Link>
      </div>
    </motion.div>

  </div>
);

export default About;