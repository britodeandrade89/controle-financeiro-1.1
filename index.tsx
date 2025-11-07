// @ts-nocheck
import { GoogleGenAI, Chat } from "@google/genai";
import { db, auth, isConfigured, firebaseConfig } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";


// =================================================================================
// ICONS & CATEGORIES
// =================================================================================
const ICONS = {
    add: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    income: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5-5-5 5M17 19l-5 5-5 5"></path></svg>`,
    expense: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5-5"></path></svg>`,
    fixed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    variable: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    shopping: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    aiAnalysis: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 8.3 9c.5 1.1 1.4 2 2.7 2s2.2-.9 2.7-2c.1-.4.2-.8.3-1.3.6-1.1 0-2.3-1-3.1-.3-.2-.6-.3-1-.3z"></path><path d="M12 21c-1.2 0-2.4-.6-3-1.7A3.6 3.6 0 0 1 8.3 15c.5-1.1 1.4-2 2.7-2s2.2.9 2.7 2c.1.4.2.8.3 1.3.6 1.1 0 2.3-1 3.1-.3-.2-.6-.3-1 .3z"></path><path d="M3 12c0-1.2.6-2.4 1.7-3A3.6 3.6 0 0 1 9 8.3c1.1.5 2 1.4 2 2.7s-.9 2.2-2 2.7c-.4.1-.8.2-1.3.3-1.1.6-2.3 0-3.1-1 .2-.3-.3-.6-.3-1z"></path><path d="M21 12c0-1.2-.6-2.4-1.7-3A3.6 3.6 0 0 0 15 8.3c-1.1.5-2 1.4-2 2.7s.9 2.2 2 2.7c.4.1.8.2 1.3.3 1.1.6 2.3 0-3.1-1 .2-.3.3-.6-.3-1z"></path></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.09 16.05a2.41 2.41 0 0 1-2.41-2.41V10a4.69 4.69 0 0 0-9.38 0v3.64a2.41 2.41 0 0 1-2.41 2.41"></path><path d="M8.5 16.05V18a1.5 1.5 0 0 0 3 0v-1.95"></path><path d="M15.09 16.05a2.41 2.41 0 0 0 2.41-2.41V10a4.69 4.69 0 0 1 9.38 0v3.64a2.41 2.41 0 0 0 2.41 2.41"></path><path d="M17.5 16.05V18a1.5 1.5 0 0 1-3 0v-1.95"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    goal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    investment: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"></path><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path><path d="M12 12h.01"></path></svg>`,
    sync: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 0 3.5 12.5"/><path d="M2 12.5a10 10 0 0 0 18.5-1"/></svg>`,
    cloudUp: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 12M15 9l-3-3-3 3"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a5.3 5.3 0 0 1-4.2-2.1"/><path d="M12 22a5.3 5.3 0 0 0 4.2-2.1"/><path d="M15 16.5l-3-3-1.5 1.5"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudOff: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

const SPENDING_CATEGORIES = {
    moradia: { name: 'Moradia', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
    alimentacao: { name: 'Alimentação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`},
    transporte: { name: 'Transporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    abastecimento_mumbuca: { name: 'Abastecimento com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    saude: { name: 'Saúde', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 2A4.99 4.99 0 0 1 17 7L17 7A4.99 4.99 0 0 1 12 12L12 12A4.99 4.99 0 0 1 7 7L7 7A4.99 4.99 0 0 1 12 2z"></path><path d="M12 12L12 22"></path><path d="M17 7L22 7"></path><path d="M7 7L2 7"></path></svg>` },
    lazer: { name: 'Lazer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
    educacao: { name: 'Educação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10v6M12 2v14M8 16L4 14M16 16l4-2M12 22a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path></svg>` },
    dividas: { name: 'Dívidas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>` },
    pessoal: { name: 'Pessoal', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5c-3.5 0-6.5 2-6.5 4.5h13c0-2.5-3-4.5-6.5-4.5z"></path><path d="M20.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path><path d="M3.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path></svg>` },
    investimento: { name: 'Investimento para Viagem', icon: ICONS.investment },
    shopping: { name: 'Compras com Mumbuca', icon: ICONS.shopping },
    avulsos: { name: 'Avulsos', icon: ICONS.variable },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>` },
};

// =================================================================================
// INITIAL DATA (SOURCE OF TRUTH FOR NOVEMBER 2025)
// =================================================================================
const CORRECT_DATA_VERSION = "v2.0-final";
const initialMonthData = {
    dataVersion: CORRECT_DATA_VERSION,
    incomes: [
        { id: "inc_nov_1", description: 'SALARIO MARCELLY', amount: 3349.92, paid: true },
        { id: "inc_nov_2", description: 'SALARIO ANDRE', amount: 3349.92, paid: true },
        { id: "inc_nov_3", description: 'MUMBUCA MARCELLY', amount: 650.00, paid: true },
        { id: "inc_nov_4", description: 'MUMBUCA ANDRE', amount: 650.00, paid: true },
        { id: "inc_nov_5", description: 'Dinheiro que o seu Claudio deu', amount: 100.00, paid: true },
    ],
    expenses: [
        { id: "exp_nov_1", description: "SEGURO DO CARRO (NOVEMBRO)", amount: 142.90, type: "fixed", category: "transporte", paid: true, cyclic: true, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 11, total: 12 },
        { id: "exp_nov_2", description: "INVESTIMENTO PARA VIAGEM DE FÉRIAS (PaGol)", amount: 1000.00, type: "fixed", category: "investimento", paid: true, cyclic: false, dueDate: '2025-10-31', paidDate: '2025-10-31', current: 2, total: 5 },
        { id: "exp_nov_3", description: "ALUGUEL", amount: 1300.00, type: "fixed", category: "moradia", paid: true, cyclic: true, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 10, total: 12 },
        { id: "exp_nov_4", description: "PSICÓLOGA DA MARCELLY", amount: 210.00, type: "fixed", category: "saude", paid: true, cyclic: true, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 10, total: 12 },
        { id: "exp_nov_5", description: "INTERNET DE CASA (ESTAVA ATRASADA)", amount: 125.85, type: "fixed", category: "moradia", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 10, total: 12 },
        { id: "exp_nov_6", description: "CONTA DA VIVO --- ANDRÉ (ATRASADAS DE AGOSTO, SETEMBRO E OUTUBRO)", amount: 86.86, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 10, total: 12 },
        { id: "exp_nov_7", description: "CONTA DA CLARO", amount: 74.99, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 11, total: 12 },
        { id: "exp_nov_8", description: "CONTA DA VIVO --- MARCELLY", amount: 66.56, type: "fixed", category: "pessoal", paid: true, cyclic: true, dueDate: '2025-11-05', paidDate: '2025-11-05', current: 10, total: 12 },
        { id: "exp_nov_9", description: "REMÉDIOS DO ANDRÉ", amount: 0.00, type: "fixed", category: "saude", paid: false, cyclic: true, dueDate: '2025-11-05', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_10", description: "INTERMÉDICA DO ANDRÉ (MARCIA BRITO)", amount: 123.00, type: "fixed", category: "saude", paid: false, cyclic: true, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_11", description: "APPAI DA MARCELLY", amount: 110.00, type: "fixed", category: "educacao", paid: false, cyclic: true, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_12", description: "APPAI DO ANDRÉ (MARCIA BRITO)", amount: 129.00, type: "fixed", category: "educacao", paid: false, cyclic: true, dueDate: '2025-11-20', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_13", description: "CIDADANIA PORTUGUESA", amount: 140.00, type: "fixed", category: "outros", paid: false, cyclic: false, dueDate: '2025-11-20', paidDate: null, current: 13, total: 36 },
        { id: "exp_nov_14", description: "EMPRÉSTimo PARA ACABAR DE PASSAR ABRIL (MARCIA BRITO)", amount: 220.00, type: "fixed", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-25', paidDate: null, current: 6, total: 6 },
        { id: "exp_nov_15", description: "RENEGOCIAÇÃO DO CARREFOUR (MARCIA BRITO)", amount: 250.00, type: "fixed", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 2, total: 12 },
        { id: "exp_nov_16", description: "DALUZ (LILI)", amount: 88.50, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_17", description: "VESTIDO CÍTRICA (LILI)", amount: 53.57, type: "variable", category: "pessoal", paid: true, cyclic: false, dueDate: '2025-11-03', paidDate: '2025-11-03', current: 1, total: 2 },
        { id: "exp_nov_18", description: "PARCELAMENTO DO ITAÚ --- ANDRÉ", amount: 159.59, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 3, total: 3 },
        { id: "exp_nov_19", description: "Pagamento de fatura atrasada do Inter", amount: 5.50, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_20", description: "ACORDO ITAÚ ANDRÉ (CARTÃO DE CRÉDITO E CHEQUE ESPECIAL)", amount: 233.14, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 1, total: 1 },
        { id: "exp_nov_21", description: "FATURA DO CARTÃO DO ANDRÉ", amount: 103.89, type: "variable", category: "dividas", paid: true, cyclic: false, dueDate: '2025-10-30', paidDate: '2025-10-30', current: 11, total: 12 },
        { id: "exp_nov_22", description: "TEATRO (JADY)", amount: 126.09, type: "variable", category: "lazer", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 2, total: 2 },
        { id: "exp_nov_23", description: "PRESENTE JULIANA (JADY)", amount: 34.65, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 1, total: 1 },
        { id: "exp_nov_24", description: "PRESENTE NENEM GLEYCI (JADY)", amount: 38.94, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-05', paidDate: null, current: 1, total: 2 },
        { id: "exp_nov_25", description: "VESTIDO LONGO AMARELO (MÃE DA MARCELLY)", amount: 33.00, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-10', paidDate: null, current: 2, total: 3 },
        { id: "exp_nov_26", description: "BLUSA BRANCA DALUZ (MÃE DA MARCELLY)", amount: 34.50, type: "variable", category: "pessoal", paid: false, cyclic: false, dueDate: '2025-11-10', paidDate: null, current: 2, total: 2 },
        { id: "exp_nov_27", description: "FATURA CARTÃO MARCELLY", amount: 100.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-15', paidDate: null, current: 10, total: 12 },
        { id: "exp_nov_28", description: "CONSERTO DO CARRO COM PEÇAS DE OUTUBRO (MARCIA BRITO)", amount: 361.75, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 1, total: 4 },
        { id: "exp_nov_29", description: "PEÇAS DO CARRO - CONSERTO DE DEZEMBRO (MARCIA BRITO)", amount: 67.70, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 10, total: 10 },
        { id: "exp_nov_30", description: "MÃO DE OBRA DO DAVI (MARCIA BRITO)", amount: 108.33, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 3, total: 3 },
        { id: "exp_nov_31", description: "PEÇA DO CARRO (MARCIA BRITO)", amount: 45.00, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-28', paidDate: null, current: 3, total: 3 },
        { id: "exp_nov_32", description: "MULTAS (MARCIA BRITO)", amount: 260.00, type: "variable", category: "transporte", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 2, total: 4 },
        { id: "exp_nov_33", description: "EMPRÉSTimo DA TIA CÉLIA", amount: 400.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 8, total: 10 }
    ],
    shoppingItems: [],
    avulsosItems: [
        { id: "avulso_28", description: 'Correios', amount: 69.02, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_27", description: 'Mercado', amount: 78.80, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_26", description: 'Pagamento a Gustavo dutra', amount: 40.00, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_25", description: 'Esmalte', amount: 9.97, paid: true, paidDate: '2025-11-05', category: 'pessoal'},
        { id: "avulso_24", description: 'Drogaria raia', amount: 8.99, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_23", description: 'Drogaria', amount: 15.98, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_22", description: 'Açucar', amount: 4.99, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_21", description: 'Pix pra alguém', amount: 2.00, paid: true, paidDate: '2025-11-05', category: 'outros'},
        { id: "avulso_20", description: 'Hortifruti', amount: 16.37, paid: true, paidDate: '2025-11-05', category: 'alimentacao'},
        { id: "avulso_19", description: 'Drogaria', amount: 44.14, paid: true, paidDate: '2025-11-05', category: 'saude'},
        { id: "avulso_18", description: 'Bela Ferraz', amount: 94.97, paid: true, paidDate: '2025-11-05', category: 'lazer'},
        { id: "avulso_17", description: 'Gás', amount: 95.00, paid: true, paidDate: '2025-11-04', category: 'moradia'},
        { id: "avulso_16", description: 'Açaí', amount: 26.00, paid: true, paidDate: '2025-11-03', category: 'alimentacao'},
        { id: "avulso_15", description: 'Pedágio-ponte', amount: 6.20, paid: true, paidDate: '2025-11-03', category: 'transporte'},
        { id: "avulso_14", description: 'Pipoca', amount: 14.00, paid: true, paidDate: '2025-11-03', category: 'alimentacao'},
        { id: "avulso_13", description: 'Almoço no joão joão', amount: 18.86, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_12", description: 'Mil opções fita e organizador de remédios', amount: 11.88, paid: true, paidDate: '2025-11-01', category: 'pessoal'},
        { id: "avulso_11", description: 'Mercado', amount: 24.67, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_10", description: 'Adoçante', amount: 13.89, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_9", description: 'Hortifruti', amount: 31.66, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_8", description: 'Mercado-coca', amount: 8.99, paid: true, paidDate: '2025-11-01', category: 'alimentacao'},
        { id: "avulso_7", description: 'Abastecimento', amount: 155.84, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_6", description: 'Estacionamento', amount: 20.00, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_5", description: 'Pão e Mortadela', amount: 10.00, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
        { id: "avulso_4", description: 'Capinha e pulseira do relógio no mercado livre', amount: 94.84, paid: true, paidDate: '2025-10-30', category: 'pessoal'},
        { id: "avulso_3", description: 'Mercado', amount: 100.00, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
        { id: "avulso_2", description: 'Pedágio da ponte', amount: 6.20, paid: true, paidDate: '2025-10-30', category: 'transporte'},
        { id: "avulso_1", description: 'Mercado', amount: 98.42, paid: true, paidDate: '2025-10-30', category: 'alimentacao'},
    ],
    goals: [
        { id: "goal_1", category: "shopping", amount: 900.00 },
        { id: "goal_2", category: "moradia", amount: 2200.00 },
        { id: "goal_3", category: "saude", amount: 1200.00 },
        { id: "goal_4", category: "dividas", amount: 1500.00 },
        { id: "goal_abastecimento", category: "abastecimento_mumbuca", amount: 400.00 },
        { id: "goal_investimento", category: "investimento", amount: 3000.00 },
    ],
    bankAccounts: [
        { id: "acc_1", name: "Conta Principal", balance: -2232.86 },
        { id: "acc_2", name: "Poupança", balance: 0.00 },
    ]
};

// =================================================================================
// STATE & AI INSTANCE
// =================================================================================
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chat: Chat | null = null;
let currentMonthData = null; // Start with null data
let currentMonth = 11; // Start directly in November
let currentYear = 2025; // Start directly in 2025
let deferredPrompt;
let hasForcedCloudUpdate = localStorage.getItem('hasForcedCloudUpdate') === 'true';


// =================================================================================
// FIREBASE SYNC STATE
// =================================================================================
let currentUser = null;
let firestoreUnsubscribe = null;
let isSyncing = false;
let syncStatus = 'disconnected'; // 'disconnected', 'syncing', 'synced', 'error'


// =================================================================================
// DOM ELEMENTS
// =================================================================================
const elements = {
    monthDisplay: document.getElementById('monthDisplay'),
    totalIncome: document.getElementById('totalIncome'),
    totalIncomeProgressBar: document.getElementById('totalIncomeProgressBar'),
    totalIncomeSubtitle: document.getElementById('totalIncomeSubtitle'),
    salaryIncome: document.getElementById('salaryIncome'),
    salaryIncomeProgressBar: document.getElementById('salaryIncomeProgressBar'),
    salaryIncomeSubtitle: document.getElementById('salaryIncomeSubtitle'),
    mumbucaIncome: document.getElementById('mumbucaIncome'),
    mumbucaIncomeProgressBar: document.getElementById('mumbucaIncomeProgressBar'),
    mumbucaIncomeSubtitle: document.getElementById('mumbucaIncomeSubtitle'),
    monthlyDebts: document.getElementById('monthlyDebts'),
    monthlyDebtsProgressBar: document.getElementById('monthlyDebtsProgressBar'),
    monthlyDebtsSubtitle: document.getElementById('monthlyDebtsSubtitle'),
    finalBalance: document.getElementById('finalBalance'),
    finalBalanceSubtitle: document.getElementById('finalBalanceSubtitle'),
    incomesList: document.getElementById('incomesList'),
    expensesList: document.getElementById('expensesList'),
    shoppingList: document.getElementById('shoppingList'),
    avulsosList: document.getElementById('avulsosList'),
    goalsList: document.getElementById('goalsList'),
    bankAccountsList: document.getElementById('bankAccountsList'),
    overviewChart: document.getElementById('overviewChart'),
    appContainer: document.getElementById('app-container'),
    mainContent: document.getElementById('main-content'),
    monthSelector: document.querySelector('.month-selector'),
    addModal: document.getElementById('addModal'),
    editModal: document.getElementById('editModal'),
    aiModal: document.getElementById('aiModal'),
    goalModal: document.getElementById('goalModal'),
    accountModal: document.getElementById('accountModal'),
    addModalTitle: document.getElementById('addModalTitle'),
    addForm: document.getElementById('addForm'),
    typeGroup: document.getElementById('typeGroup'),
    categoryGroup: document.getElementById('categoryGroup'),
    installmentsGroup: document.getElementById('installmentsGroup'),
    dueDateGroup: document.getElementById('dueDateGroup'),
    editForm: document.getElementById('editForm'),
    editModalTitle: document.getElementById('editModalTitle'),
    editItemId: document.getElementById('editItemId'),
    editItemType: document.getElementById('editItemType'),
    editDescription: document.getElementById('editDescription'),
    editAmount: document.getElementById('editAmount'),
    editCategoryGroup: document.getElementById('editCategoryGroup'),
    editCategory: document.getElementById('editCategory'),
    editDueDate: document.getElementById('editDueDate'),
    editDueDateGroup: document.getElementById('editDueDateGroup'),
    editPaidDate: document.getElementById('editPaidDate'),
    editPaidDateGroup: document.getElementById('editPaidDateGroup'),
    editInstallmentsGroup: document.getElementById('editInstallmentsGroup'),
    editCurrentInstallment: document.getElementById('editCurrentInstallment'),
    editTotalInstallments: document.getElementById('editTotalInstallments'),
    editInstallmentsInfo: document.getElementById('editInstallmentsInfo'),
    aiAnalysis: document.getElementById('aiAnalysis'),
    aiModalTitle: document.getElementById('aiModalTitle'),
    aiChatForm: document.getElementById('aiChatForm'),
    aiChatInput: document.getElementById('aiChatInput'),
    goalModalTitle: document.getElementById('goalModalTitle'),
    goalForm: document.getElementById('goalForm'),
    goalId: document.getElementById('goalId'),
    goalCategory: document.getElementById('goalCategory'),
    goalAmount: document.getElementById('goalAmount'),
    accountModalTitle: document.getElementById('accountModalTitle'),
    accountForm: document.getElementById('accountForm'),
    accountId: document.getElementById('accountId'),
    accountName: document.getElementById('accountName'),
    accountBalance: document.getElementById('accountBalance'),
    tabBar: document.getElementById('tab-bar'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    appViews: document.querySelectorAll('.app-view'),
    segmentedBtns: document.querySelectorAll('.segmented-btn'),
    syncBtn: document.getElementById('sync-btn'),
};

// =================================================================================
// UTILS
// =================================================================================
function formatCurrency(value) {
    if (typeof value !== 'number') value = 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrency(value) {
    if (typeof value !== 'string' || !value) return 0;
    const digits = value.replace(/\D/g, '');
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
}

function getMonthName(month) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function simpleMarkdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\s*-\s/g, '<br>• ')
        .replace(/\n\s*\*\s/g, '<br>• ')
        .replace(/\n/g, '<br>');
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('category'),
        document.getElementById('editCategory'),
    ];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Selecione...</option>';
            for (const key in SPENDING_CATEGORIES) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = SPENDING_CATEGORIES[key].name;
                select.appendChild(option);
            }
        }
    });

    const goalCategorySelect = document.getElementById('goalCategory');
    if (goalCategorySelect) {
        goalCategorySelect.innerHTML = '<option value="">Selecione...</option>';
        Object.keys(SPENDING_CATEGORIES)
            .filter(key => key !== 'avulsos') // Don't allow manual 'avulsos' goal
            .forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = SPENDING_CATEGORIES[key].name;
                goalCategorySelect.appendChild(option);
            });
    }
}


// =================================================================================
// DATA HANDLING & SYNC
// =================================================================================
async function saveDataToFirestore() {
    if (!currentUser || !isConfigured || !currentMonthData) return;
    if (isSyncing) return;

    isSyncing = true;
    syncStatus = 'syncing';
    updateSyncButtonState();

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);

    try {
        await setDoc(docRef, currentMonthData);
        syncStatus = 'synced';
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        syncStatus = 'error';
    } finally {
        isSyncing = false;
        updateSyncButtonState();
    }
}


function saveData() {
    updateUI();
    saveDataToFirestore();
}

async function loadDataForCurrentMonth() {
    if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
    }

    if (!currentUser || !isConfigured) {
        console.warn("Firebase not configured. Cannot load cloud data.");
        updateUI(); 
        return;
    }

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
             currentMonthData = docSnap.data();
        } else {
            await createNewMonthData();
        }
    } catch(error) {
        console.error(`[Data] Error fetching month ${monthKey}:`, error);
        syncStatus = 'error';
    } finally {
        updateUI();
        updateMonthDisplay();
        attachFirestoreListener();
    }
}


function attachFirestoreListener() {
    if (!currentUser || !isConfigured || firestoreUnsubscribe) return;
    
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    
    firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && !isSyncing) { // Prevent local overrides during sync
            console.log(`[Firestore Listener] Real-time update for ${monthKey}`);
            currentMonthData = docSnap.data();
            updateUI();
        }
    }, (error) => {
        console.error("Error with Firestore listener:", error);
        syncStatus = 'error';
        updateSyncButtonState();
    });
}


async function createNewMonthData() {
    console.log("[Data] Creating new month data from previous month...");
    
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    let baseData = null;
    
    if(isConfigured && currentUser) {
        const prevDocRef = doc(db, 'users', currentUser.uid, 'months', previousMonthKey);
        try {
            const prevDocSnap = await getDoc(prevDocRef);
            if (prevDocSnap.exists()) {
                baseData = prevDocSnap.data();
            }
        } catch (e) { console.error("Could not fetch previous month data", e); }
    }

    if (!baseData) {
        console.log("No previous month data found, using initial data as base.");
        baseData = initialMonthData;
    }
    
    const clonedBankAccounts = (baseData.bankAccounts || []).map(acc => ({...acc}));
    const clonedGoals = (baseData.goals || []).map(goal => ({...goal}));

    const newMonthData = {
        dataVersion: `generated-${Date.now()}`,
        incomes: [],
        expenses: [],
        shoppingItems: [],
        avulsosItems: [],
        goals: clonedGoals,
        bankAccounts: clonedBankAccounts
    };

    newMonthData.incomes.push(
        { id: `inc_salario_marcelly_${Date.now()}`, description: 'SALARIO MARCELLY', amount: 3349.92, paid: false },
        { id: `inc_salario_andre_${Date.now()}`, description: 'SALARIO ANDRE', amount: 3349.92, paid: false },
        { id: `inc_mumbuca_marcelly_${Date.now()}`, description: 'MUMBUCA MARCELLY', amount: 650.00, paid: false },
        { id: `inc_mumbuca_andre_${Date.now()}`, description: 'MUMBUCA ANDRE', amount: 650.00, paid: false }
    );
    
    const recurringExpenses = (baseData.expenses || []).filter(exp => exp.cyclic);
    recurringExpenses.forEach(exp => {
        let newCurrent = exp.current;
        if (exp.current < exp.total) {
            newCurrent++;
        }
        
        const newDueDate = new Date(exp.dueDate);
        newDueDate.setMonth(newDueDate.getMonth() + 1);
        
        newMonthData.expenses.push({
            ...exp,
            id: `exp_${Date.now()}_${Math.random()}`,
            paid: false,
            paidDate: null,
            current: newCurrent,
            dueDate: newDueDate.toISOString().split('T')[0]
        });
    });

    currentMonthData = newMonthData;
    await saveDataToFirestore(); 
}

function updateMonthDisplay() {
    elements.monthDisplay.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
}

function changeMonth(direction) {
    if (direction === 'next') {
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    } else {
        currentMonth--;
        if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
        }
    }
    loadDataForCurrentMonth();
}

// =================================================================================
// CALCULATIONS
// =================================================================================
function calculateTotals() {
    if (!currentMonthData) return { totalIncome: 0, salaryIncome: 0, mumbucaIncome: 0, totalExpenses: 0, paidExpenses: 0, salarySpent: 0, mumbucaSpent: 0, finalBalance: 0, totalToPayForMarcia: 0 };

    const incomes = currentMonthData.incomes || [];
    const expenses = currentMonthData.expenses || [];
    const shopping = currentMonthData.shoppingItems || [];
    const avulsos = currentMonthData.avulsosItems || [];

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const salaryIncome = incomes.filter(i => i.description.toLowerCase().includes('salario')).reduce((sum, item) => sum + item.amount, 0);
    const mumbucaIncome = incomes.filter(i => i.description.toLowerCase().includes('mumbuca')).reduce((sum, item) => sum + item.amount, 0);

    const allExpenses = [...expenses, ...shopping, ...avulsos];
    const totalExpenses = allExpenses.reduce((sum, item) => sum + item.amount, 0);
    const paidExpenses = allExpenses.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);
    
    const salarySpent = paidExpenses; 
    
    const mumbucaSpent = shopping.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0);

    const finalBalance = salaryIncome - paidExpenses;
    
    const totalToPayForMarcia = expenses.filter(e => !e.paid && e.description.toLowerCase().includes('marcia brito')).reduce((acc, curr) => acc + curr.amount, 0);

    return {
        totalIncome,
        salaryIncome,
        mumbucaIncome,
        totalExpenses,
        paidExpenses,
        salarySpent,
        mumbucaSpent,
        finalBalance,
        totalToPayForMarcia
    };
}


function calculateCategoryTotals() {
    if (!currentMonthData) return [];
    const categoryTotals = {};
    const allItems = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    
    allItems.forEach(item => {
        const category = item.category || 'outros';
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += item.amount;
    });

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}


// =================================================================================
// UI RENDERING
// =================================================================================
function updateUI() {
    if (!currentMonthData) return;
    renderHomeScreen();
    renderIncomes();
    renderExpenses();
    renderShopping();
    renderAvulsos();
    renderGoals();
    renderBankAccounts();
}

function renderHomeScreen() {
    const totals = calculateTotals();

    elements.totalIncome.textContent = formatCurrency(totals.totalIncome);
    elements.totalIncomeProgressBar.style.width = '100%';
    elements.totalIncomeSubtitle.textContent = `100% recebido`;
    
    elements.salaryIncome.textContent = formatCurrency(totals.salaryIncome);
    const salaryProgress = totals.salaryIncome > 0 ? (totals.salarySpent / totals.salaryIncome) * 100 : 0;
    elements.salaryIncomeProgressBar.style.width = `${Math.min(salaryProgress, 100)}%`;
    elements.salaryIncomeSubtitle.textContent = `${formatCurrency(totals.salarySpent)} gastos de ${formatCurrency(totals.salaryIncome)}`;
    
    elements.mumbucaIncome.textContent = formatCurrency(totals.mumbucaIncome);
    const mumbucaProgress = totals.mumbucaIncome > 0 ? (totals.mumbucaSpent / totals.mumbucaIncome) * 100 : 0;
    elements.mumbucaIncomeProgressBar.style.width = `${Math.min(mumbucaProgress, 100)}%`;
    elements.mumbucaIncomeSubtitle.textContent = `${formatCurrency(totals.mumbucaSpent)} gastos de ${formatCurrency(totals.mumbucaIncome)}`;
    
    elements.monthlyDebts.textContent = formatCurrency(totals.totalExpenses);
    const debtsProgress = totals.totalExpenses > 0 ? (totals.paidExpenses / totals.totalExpenses) * 100 : 0;
    elements.monthlyDebtsProgressBar.style.width = `${debtsProgress}%`;
    elements.monthlyDebtsSubtitle.textContent = `${formatCurrency(totals.paidExpenses)} pagos de ${formatCurrency(totals.totalExpenses)}`;
    
    elements.finalBalance.textContent = formatCurrency(totals.finalBalance);
    elements.finalBalance.classList.toggle('balance-positive', totals.finalBalance >= 0);
    elements.finalBalance.classList.toggle('balance-negative', totals.finalBalance < 0);
    
    renderPieChart();

    const debtSummaryContainer = document.querySelector('.chart-container .section-header');
    let debtSummaryEl = document.getElementById('debt-summary-marcia');
    if (!debtSummaryEl) {
        debtSummaryEl = document.createElement('div');
        debtSummaryEl.id = 'debt-summary-marcia';
        debtSummaryEl.className = 'debt-summary';
        debtSummaryContainer.insertAdjacentElement('afterend', debtSummaryEl);
    }
    
    debtSummaryEl.innerHTML = `
        <div class="debt-summary-header">
            <span>Total a pagar para</span>
            <span class="debt-summary-title">Marcia Brito</span>
        </div>
        <div class="debt-summary-amount">${formatCurrency(totals.totalToPayForMarcia)}</div>
    `;
}

function renderPieChart() {
    const categoryTotals = calculateCategoryTotals();
    const totalSpent = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);
    elements.overviewChart.innerHTML = '';
    
    if (categoryTotals.length === 0) {
        elements.overviewChart.innerHTML = `<div class="empty-state-small">${ICONS.info}<span>Nenhuma despesa registrada para gerar o gráfico.</span></div>`;
        return;
    }
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'pie-chart-container';
    
    const pieChart = document.createElement('div');
    pieChart.className = 'pie-chart';
    
    const legend = document.createElement('div');
    legend.className = 'pie-chart-legend';
    
    const colors = ['#14b8a6', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#10b981', '#6366f1', '#d946ef'];
    let gradientParts = [];
    let currentAngle = 0;
    
    categoryTotals.forEach((cat, index) => {
        const percentage = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
        const color = colors[index % colors.length];
        
        const angle = totalSpent > 0 ? (cat.amount / totalSpent) * 360 : 0;
        gradientParts.push(`${color} ${currentAngle}deg ${currentAngle + angle}deg`);
        currentAngle += angle;

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-label">
                <div class="legend-color" style="background-color: ${color};"></div>
                <span>${SPENDING_CATEGORIES[cat.category]?.name || 'Outros'}</span>
            </div>
            <div class="legend-value">
                ${formatCurrency(cat.amount)}
                <span class="legend-percentage">(${percentage.toFixed(1)}%)</span>
            </div>
        `;
        legend.appendChild(legendItem);
    });

    pieChart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    
    chartContainer.appendChild(pieChart);
    chartContainer.appendChild(legend);
    elements.overviewChart.appendChild(chartContainer);
}


function renderList(listElement, items, type) {
    listElement.innerHTML = '';
    if (!items || items.length === 0) {
        listElement.innerHTML = `<div class="empty-state-small">${ICONS.info}<span>Nenhum item adicionado ainda.</span></div>`;
        return;
    }

    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.dataset.id = item.id;
        itemEl.dataset.type = type;

        const isExpense = type === 'expenses' || type === 'shopping' || type === 'avulsos';
        const isIncome = type === 'incomes';
        const hasDueDate = item.dueDate;
        const isOverdue = hasDueDate && !item.paid && new Date(item.dueDate) < new Date();

        let html = `
            <button class="check-btn ${item.paid ? 'paid' : ''}" data-id="${item.id}" data-type="${type}" aria-label="Marcar como pago">
                ${ICONS.check}
            </button>
            <div class="item-info-wrapper">
                <div class="item-primary-info">
                    <span class="item-description ${item.paid ? 'paid' : ''}">${item.description}</span>
                    <span class="item-amount ${isIncome ? 'income-amount' : 'expense-amount'}">${formatCurrency(item.amount)}</span>
                </div>
                <div class="item-secondary-info">
                    <div class="item-meta">
        `;
        
        if (item.type) {
            html += `<span class="item-type type-${item.type}">${item.type === 'fixed' ? 'Fixo' : 'Variável'}</span>`;
        }

        if (item.current && item.total) {
            html += `<span class="item-installments">${item.current}/${item.total}</span>`;
        }
        
        html += `
                    </div>
                     <div class="item-actions">
                        <button class="action-btn edit-btn" data-id="${item.id}" data-type="${type}">${ICONS.edit}</button>
                        <button class="action-btn delete-btn" data-id="${item.id}" data-type="${type}">${ICONS.delete}</button>
                    </div>
                </div>
        `;

        if (isExpense) {
            html += `<div class="item-tertiary-info">`;
            if (item.paid && item.paidDate) {
                html += `<span><span style="color:var(--success)">✓</span> Pago em ${formatDate(item.paidDate)}</span>`;
            } else if (hasDueDate) {
                html += `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(item.dueDate)}</span>`;
            }
            html += `</div>`;
        }

        html += `</div>`;
        itemEl.innerHTML = html;
        listElement.appendChild(itemEl);
    });
}

function renderIncomes() {
    renderList(elements.incomesList, (currentMonthData.incomes || []).slice().sort((a,b) => b.amount - a.amount), 'incomes');
}
function renderExpenses() {
    const sortedExpenses = (currentMonthData.expenses || []).slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    renderList(elements.expensesList, sortedExpenses, 'expenses');
}
function renderShopping() {
    renderList(elements.shoppingList, (currentMonthData.shoppingItems || []).slice().sort((a,b) => b.id - a.id), 'shopping');
}
function renderAvulsos() {
    const sortedAvulsos = (currentMonthData.avulsosItems || []).slice().sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    renderList(elements.avulsosList, sortedAvulsos, 'avulsos');
}

function renderGoals() {
    elements.goalsList.innerHTML = '';
    const goals = currentMonthData.goals || [];
    const avulsosTotal = (currentMonthData.avulsosItems || []).reduce((sum, item) => sum + item.amount, 0);

    let avulsosGoal = goals.find(g => g.category === 'avulsos');
    if (!avulsosGoal) {
        avulsosGoal = { id: 'goal_avulsos', category: 'avulsos', amount: Math.max(400, avulsosTotal * 0.5), isAuto: true };
    } else {
        avulsosGoal.isAuto = true;
    }

    const allGoals = [avulsosGoal, ...goals.filter(g => g.category !== 'avulsos')];

    if (allGoals.length === 0) {
        elements.goalsList.innerHTML = `<div class="empty-state">${ICONS.goal}<h3>Sem Metas Definidas</h3><p>Crie metas para acompanhar seus gastos por categoria.</p></div>`;
        return;
    }
    
    allGoals.forEach(goal => {
        const categoryInfo = SPENDING_CATEGORIES[goal.category];
        if (!categoryInfo) return;

        let spent = 0;
        if (goal.category === 'shopping') {
            spent = (currentMonthData.shoppingItems || []).reduce((sum, item) => sum + item.amount, 0);
        } else if (goal.category === 'avulsos') {
            spent = avulsosTotal;
        } else {
            spent = (currentMonthData.expenses || []).filter(e => e.category === goal.category).reduce((sum, item) => sum + item.amount, 0);
        }

        const progress = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
        const remaining = goal.amount - spent;
        
        let progressClass = 'safe';
        if (progress > 100) progressClass = 'danger';
        else if (progress > 75) progressClass = 'warning';

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">
                    ${categoryInfo.icon}
                    <span>${categoryInfo.name}</span>
                </div>
                <div class="goal-card-actions">
                    ${goal.isAuto 
                        ? `<div class="goal-card-auto-info" title="Esta meta é ajustada automaticamente com base nos seus gastos.">${ICONS.lightbulb} Automático</div>` 
                        : `<button class="action-btn edit-goal-btn" data-id="${goal.id}">${ICONS.edit}</button><button class="action-btn delete-goal-btn" data-id="${goal.id}">${ICONS.delete}</button>`
                    }
                </div>
            </div>
            <div class="goal-card-body">
                <div class="goal-amounts">
                    <span class="goal-spent-amount">${formatCurrency(spent)}</span>
                    <span class="goal-total-amount">de ${formatCurrency(goal.amount)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-bar-inner ${progressClass}" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <div class="goal-remaining ${remaining < 0 ? 'over' : 'safe'}">
                    ${remaining >= 0 ? `${formatCurrency(remaining)} restantes` : `${formatCurrency(Math.abs(remaining))} acima`}
                </div>
            </div>
        `;
        elements.goalsList.appendChild(card);
    });
}

function renderBankAccounts() {
    elements.bankAccountsList.innerHTML = '';
    const accounts = currentMonthData.bankAccounts || [];
    
    if (accounts.length === 0) {
        elements.bankAccountsList.innerHTML = `<div class="empty-state-small" style="padding: 1rem;">${ICONS.info}<span>Nenhuma conta adicionada.</span></div>`;
        document.getElementById('accounts-total-container').style.display = 'none';
        return;
    }

    document.getElementById('accounts-total-container').style.display = 'flex';
    let totalBalance = 0;
    
    accounts.forEach(account => {
        totalBalance += account.balance;
        const accountEl = document.createElement('div');
        accountEl.className = 'account-item';
        accountEl.dataset.id = account.id;
        accountEl.innerHTML = `
            <span class="account-name">${account.name}</span>
            <div class="account-actions">
                <span class="account-balance ${account.balance < 0 ? 'balance-negative' : ''}">${formatCurrency(account.balance)}</span>
                <button class="action-btn edit-account-btn" data-id="${account.id}">${ICONS.edit}</button>
                <button class="action-btn delete-account-btn" data-id="${account.id}">${ICONS.delete}</button>
            </div>
        `;
        elements.bankAccountsList.appendChild(accountEl);
    });

    const totalAmountEl = document.getElementById('accounts-total-amount');
    totalAmountEl.textContent = formatCurrency(totalBalance);
    totalAmountEl.classList.toggle('balance-negative', totalBalance < 0);
    totalAmountEl.classList.remove('balance-positive');
}


// =================================================================================
// MODAL & FORM HANDLING
// =================================================================================
function openModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}
function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        resetForms();
    }, 300);
}
function resetForms() {
    elements.addForm.reset();
    elements.editForm.reset();
    elements.goalForm.reset();
    elements.accountForm.reset();
    ['typeGroup', 'categoryGroup', 'installmentsGroup', 'dueDateGroup', 'cyclicGroup'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
}

function setupAddModal(type) {
    resetForms();
    const modalTitle = elements.addModalTitle;
    const typeGroup = elements.typeGroup;
    const categoryGroup = elements.categoryGroup;
    const installmentsGroup = elements.installmentsGroup;
    const dueDateGroup = elements.dueDateGroup;
    const cyclicGroup = document.getElementById('cyclicGroup');
    document.getElementById('amount').placeholder = 'R$ 0,00';
    document.getElementById('description').placeholder = 'Descrição da despesa';
    
    let typeInput = document.getElementById('formType');
    if (!typeInput) {
        typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.id = 'formType';
        typeInput.name = 'formType';
        elements.addForm.appendChild(typeInput);
    }
    typeInput.value = type;

    if (type === 'income') {
        modalTitle.textContent = 'Nova Receita';
    } else if (type === 'expense') {
        modalTitle.textContent = 'Nova Despesa';
        typeGroup.style.display = 'block';
        categoryGroup.style.display = 'block';
        installmentsGroup.style.display = 'flex';
        dueDateGroup.style.display = 'block';
        cyclicGroup.style.display = 'flex';
    } else if (type === 'shopping') {
        modalTitle.textContent = 'Nova Compra com Mumbuca';
        document.getElementById('description').placeholder = 'Nome do produto ou loja';
    } else if (type === 'avulso') {
        modalTitle.textContent = 'Nova Despesa Avulsa';
        categoryGroup.style.display = 'block';
        document.getElementById('description').placeholder = 'Ex: Mercado, Padaria, Farmácia';
    }
    
    openModal(elements.addModal);
}

function setupEditModal(id, type) {
    resetForms();
    const listName = type.endsWith('e') ? `${type}s` : `${type}Items`;
    const item = (currentMonthData[listName] || []).find(i => i.id === id);
    if (!item) return;

    elements.editModalTitle.textContent = `Editar ${type === 'incomes' ? 'Receita' : 'Despesa'}`;
    elements.editItemId.value = id;
    elements.editItemType.value = type;
    elements.editDescription.value = item.description;
    elements.editAmount.value = formatCurrency(item.amount);

    const isExpenseType = ['expenses', 'shopping', 'avulsos'].includes(type);
    elements.editCategoryGroup.style.display = isExpenseType ? 'block' : 'none';
    elements.editDueDateGroup.style.display = type === 'expenses' ? 'block' : 'none';
    elements.editPaidDateGroup.style.display = isExpenseType && item.paid ? 'block' : 'none';
    elements.editInstallmentsGroup.style.display = type === 'expenses' ? 'flex' : 'none';
    elements.editInstallmentsInfo.style.display = type === 'expenses' && item.cyclic ? 'flex' : 'none';
    
    if (isExpenseType) {
        elements.editCategory.value = item.category || '';
        elements.editPaidDate.value = item.paidDate || '';
    }
    if (type === 'expenses') {
        elements.editDueDate.value = item.dueDate || '';
        elements.editCurrentInstallment.value = item.current || '';
        elements.editTotalInstallments.value = item.total || '';
    }

    openModal(elements.editModal);
}

function setupGoalModal(id = null) {
    resetForms();
    if (id) {
        const goal = currentMonthData.goals.find(g => g.id === id);
        if (goal) {
            elements.goalModalTitle.textContent = 'Editar Meta';
            elements.goalId.value = goal.id;
            elements.goalCategory.value = goal.category;
            elements.goalAmount.value = formatCurrency(goal.amount);
        }
    } else {
        elements.goalModalTitle.textContent = 'Nova Meta';
    }
    openModal(elements.goalModal);
}

function setupAccountModal(id = null) {
    resetForms();
    if (id) {
        const account = currentMonthData.bankAccounts.find(a => a.id === id);
        if (account) {
            elements.accountModalTitle.textContent = 'Editar Conta';
            elements.accountId.value = account.id;
            elements.accountName.value = account.name;
            elements.accountBalance.value = formatCurrency(account.balance);
        }
    } else {
        elements.accountModalTitle.textContent = 'Nova Conta';
    }
    openModal(elements.accountModal);
}


// =================================================================================
// EVENT HANDLERS
// =================================================================================
function handleAddFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formType = formData.get('formType');
    
    const newItem = {
        id: `${formType}_${Date.now()}`,
        description: formData.get('description'),
        amount: parseCurrency(formData.get('amount')),
        paid: false
    };

    if (formType === 'income') {
        currentMonthData.incomes.push(newItem);
    } else if (formType === 'expense') {
        newItem.type = formData.get('type');
        newItem.category = formData.get('category');
        newItem.dueDate = formData.get('dueDate');
        newItem.current = parseInt(formData.get('currentInstallment')) || null;
        newItem.total = parseInt(formData.get('totalInstallments')) || null;
        newItem.cyclic = formData.get('cyclic') === 'on';
        currentMonthData.expenses.push(newItem);
    } else if (formType === 'shopping') {
        newItem.category = 'shopping'; // Hardcoded category
        newItem.paid = true;
        newItem.paidDate = new Date().toISOString().split('T')[0];
        currentMonthData.shoppingItems.push(newItem);
    } else if (formType === 'avulso') {
        newItem.category = formData.get('category');
        newItem.paid = true;
        newItem.paidDate = new Date().toISOString().split('T')[0];
        currentMonthData.avulsosItems.push(newItem);
    }

    saveData();
    closeModal(elements.addModal);
}

function handleEditFormSubmit(e) {
    e.preventDefault();
    const id = elements.editItemId.value;
    const type = elements.editItemType.value;
    
    const listName = type.endsWith('e') ? `${type}s` : `${type}Items`;
    const list = currentMonthData[listName];
    const itemIndex = list.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    list[itemIndex].description = elements.editDescription.value;
    list[itemIndex].amount = parseCurrency(elements.editAmount.value);

    if (['expenses', 'shopping', 'avulsos'].includes(type)) {
        list[itemIndex].category = elements.editCategory.value;
        list[itemIndex].paidDate = elements.editPaidDate.value;
    }
    if (type === 'expenses') {
        list[itemIndex].dueDate = elements.editDueDate.value;
        list[itemIndex].current = parseInt(elements.editCurrentInstallment.value) || null;
        list[itemIndex].total = parseInt(elements.editTotalInstallments.value) || null;
    }

    saveData();
    closeModal(elements.editModal);
}

function handleGoalFormSubmit(e) {
    e.preventDefault();
    const id = elements.goalId.value;
    const category = elements.goalCategory.value;
    const amount = parseCurrency(elements.goalAmount.value);
    
    if (!category || !amount) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    if (id) { // Editing existing goal
        const goalIndex = currentMonthData.goals.findIndex(g => g.id === id);
        if (goalIndex > -1) {
            currentMonthData.goals[goalIndex].category = category;
            currentMonthData.goals[goalIndex].amount = amount;
        }
    } else { // Adding new goal
        if (currentMonthData.goals.some(g => g.category === category)) {
            alert('Já existe uma meta para esta categoria.');
            return;
        }
        const newGoal = {
            id: `goal_${category}_${Date.now()}`,
            category,
            amount
        };
        currentMonthData.goals.push(newGoal);
    }
    
    saveData();
    closeModal(elements.goalModal);
}

function handleAccountFormSubmit(e) {
    e.preventDefault();
    const id = elements.accountId.value;
    const name = elements.accountName.value;
    const balance = parseCurrency(elements.accountBalance.value);
    
    if (!name) {
        alert("Por favor, preencha o nome da conta.");
        return;
    }

    if (id) { // Editing
        const accIndex = currentMonthData.bankAccounts.findIndex(a => a.id === id);
        if (accIndex > -1) {
            currentMonthData.bankAccounts[accIndex].name = name;
            currentMonthData.bankAccounts[accIndex].balance = balance;
        }
    } else { // Adding
        const newAccount = { id: `acc_${Date.now()}`, name, balance };
        currentMonthData.bankAccounts.push(newAccount);
    }
    saveData();
    closeModal(elements.accountModal);
}


async function handleAiChatFormSubmit(e) {
    e.preventDefault();
    const prompt = elements.aiChatInput.value.trim();
    if (!prompt) return;

    elements.aiChatInput.value = '';
    addMessageToChatUI(prompt, 'user');

    const loadingBubble = addMessageToChatUI('...', 'ai');

    if (!chat) {
        initializeChat();
    }
    
    const financialContext = `
        **Resumo Financeiro de ${getMonthName(currentMonth)}/${currentYear}:**
        - **Receitas:** Total de ${formatCurrency(calculateTotals().totalIncome)}. Principais fontes: ${currentMonthData.incomes.map(i => i.description).join(', ')}.
        - **Despesas Fixas e Variáveis:** Total de ${formatCurrency(currentMonthData.expenses.reduce((s, i) => s + i.amount, 0))}.
        - **Compras com Mumbuca:** Total de ${formatCurrency(currentMonthData.shoppingItems.reduce((s, i) => s + i.amount, 0))}.
        - **Despesas Avulsas:** Total de ${formatCurrency(currentMonthData.avulsosItems.reduce((s, i) => s + i.amount, 0))}.
        - **Saldo Atual:** ${formatCurrency(calculateTotals().finalBalance)}.
        - **Metas de Gastos:** ${currentMonthData.goals.map(g => `${SPENDING_CATEGORIES[g.category]?.name}: ${formatCurrency(g.amount)}`).join(', ')}.
    `;
    
    const fullPrompt = `${financialContext}\n\n**Pergunta do usuário:** ${prompt}`;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user', 
            parts: [{text: fullPrompt}]
          }],
          config: {
            systemInstruction: "Você é um assistente financeiro amigável e prestativo para um aplicativo de finanças pessoais. Seu nome é 'Finanças AI'. Analise os dados fornecidos e responda às perguntas do usuário de forma clara, concisa e com dicas úteis. Use formatação markdown simples, como **negrito**, para destacar pontos importantes. Não use cabeçalhos (#). Seja sempre positivo e encorajador.",
          }
        });

        const text = response.text;
        loadingBubble.innerHTML = simpleMarkdownToHtml(text);
    } catch (error) {
        console.error("Gemini API error:", error);
        loadingBubble.innerHTML = "Desculpe, não consegui processar sua pergunta. Tente novamente.";
    }
}


function handleDelete(id, type, listName) {
    if (confirm(`Tem certeza que deseja excluir este item?`)) {
        currentMonthData[listName] = (currentMonthData[listName] || []).filter(item => item.id !== id);
        saveData();
    }
}

function handleTogglePaid(id, type) {
    const listName = type.endsWith('e') ? `${type}s` : `${type}Items`;
    const list = currentMonthData[listName];
    const item = list.find(i => i.id === id);
    if (!item) return;

    item.paid = !item.paid;
    if (item.paid) {
        item.paidDate = new Date().toISOString().split('T')[0];
    } else {
        item.paidDate = null;
    }
    
    saveData();
}

// =================================================================================
// AI CHAT
// =================================================================================
function initializeChat() {
    try {
        const welcomeMessage = `Olá! Sou o Finanças AI. Como posso ajudar a analisar suas finanças de ${getMonthName(currentMonth)}?`;
        addMessageToChatUI(welcomeMessage, 'ai');
    } catch(e) {
        console.error(e);
        addMessageToChatUI("Não foi possível iniciar a Análise IA. Verifique a configuração da sua chave de API.", 'ai');
    }
}

function addMessageToChatUI(message, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}-message`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = simpleMarkdownToHtml(message);
    
    messageEl.appendChild(bubble);
    elements.aiAnalysis.appendChild(messageEl);
    elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
    
    return bubble;
}


// =================================================================================
// FIREBASE AUTH & SYNC UI
// =================================================================================
function updateSyncButtonState() {
    const syncBtn = elements.syncBtn;
    syncBtn.classList.remove('syncing', 'unsynced', 'sync-error');
    switch (syncStatus) {
        case 'disconnected':
            syncBtn.innerHTML = ICONS.cloudOff;
            syncBtn.title = "Sincronização desativada (Firebase não configurado)";
            syncBtn.disabled = true;
            break;
        case 'syncing':
            syncBtn.innerHTML = ICONS.sync;
            syncBtn.title = "Sincronizando...";
            syncBtn.classList.add('syncing');
            syncBtn.disabled = true;
            break;
        case 'synced':
            syncBtn.innerHTML = ICONS.cloudCheck;
            syncBtn.title = "Dados salvos na nuvem";
            syncBtn.disabled = true; 
            break;
        case 'error':
            syncBtn.innerHTML = ICONS.cloudOff;
            syncBtn.title = "Erro na sincronização. Verifique a configuração.";
            syncBtn.classList.add('sync-error');
            syncBtn.disabled = true;
            break;
    }
}

function updateSyncStatusUI() {
    const statusTextEl = document.getElementById('sync-status-text');
    const userIdTextEl = document.getElementById('user-id-text');
    const userIdContainer = document.getElementById('user-id-container');
    const syncInfoEl = document.getElementById('sync-status-info');

    syncInfoEl.innerHTML = '';
    
    if (!isConfigured) {
        statusTextEl.textContent = 'Desconectado';
        statusTextEl.style.color = 'var(--text-light)';
        userIdContainer.style.display = 'none';
        syncInfoEl.innerHTML = `A sincronização na nuvem está desativada. Para habilitar, siga as instruções no arquivo <code>firebase-config.js</code> e cole suas chaves de API do Firebase.`;
        return;
    }

    if (currentUser) {
        statusTextEl.textContent = 'Conectado e Sincronizado';
        statusTextEl.style.color = 'var(--success)';
        userIdTextEl.textContent = currentUser.uid.substring(0, 12) + '...';
        userIdContainer.style.display = 'block';
        syncInfoEl.innerHTML = `Seus dados são salvos automaticamente na nuvem, permitindo o acesso de qualquer dispositivo.`;
    } else {
        statusTextEl.textContent = 'Não conectado';
        statusTextEl.style.color = 'var(--warning)';
        userIdContainer.style.display = 'none';
        syncInfoEl.innerHTML = 'Não foi possível conectar à nuvem. Verifique sua conexão ou a configuração do Firebase.';
    }
}


async function initFirebaseAuthAndSync() {
    if (!isConfigured) {
        syncStatus = 'disconnected';
        updateSyncButtonState();
        updateSyncStatusUI();
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
        } else {
            try {
                const userCredential = await signInAnonymously(auth);
                currentUser = userCredential.user;
            } catch (error) {
                console.error("Anonymous sign-in failed:", error);
                syncStatus = 'error';
                updateSyncButtonState();
                updateSyncStatusUI();
                return;
            }
        }

        updateSyncStatusUI();
        
        // Guardian logic: Check and correct data on the cloud only once.
        if (!hasForcedCloudUpdate) {
            const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
            const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
            try {
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists() || docSnap.data().dataVersion !== CORRECT_DATA_VERSION) {
                    console.log(`[GUARDIAN] Cloud data is incorrect. Forcing overwrite.`);
                    await setDoc(docRef, initialMonthData);
                    localStorage.setItem('hasForcedCloudUpdate', 'true');
                    hasForcedCloudUpdate = true;
                }
            } catch (e) {
                 console.error("[GUARDIAN] Error during data verification:", e);
                 syncStatus = 'error';
            }
        }
        
        // Now that the cloud is guaranteed to be correct, load and listen
        loadDataForCurrentMonth();
    });
}

// =================================================================================
// PWA INSTALL BANNER
// =================================================================================
function setupPwaInstall() {
    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.classList.add('visible');
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBanner.classList.remove('visible');
        }
    });

    dismissBtn.addEventListener('click', () => {
        installBanner.classList.remove('visible');
    });
}


// =================================================================================
// APP INITIALIZATION & EVENT LISTENERS
// =================================================================================
function addEventListeners() {
    document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth('prev'));
    document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth('next'));
    
    elements.tabBar.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (!tabBtn) return;
        
        if (tabBtn.id === 'openAiModalBtnTab') {
            openModal(elements.aiModal);
            if (!chat) initializeChat();
            return;
        }

        const viewId = `view-${tabBtn.dataset.view}`;
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');
        elements.appViews.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    });

    document.querySelector('.segmented-control').addEventListener('click', (e) => {
        const segBtn = e.target.closest('.segmented-btn');
        if (!segBtn) return;

        const listId = segBtn.dataset.list;
        elements.segmentedBtns.forEach(btn => btn.classList.remove('active'));
        segBtn.classList.add('active');
        
        document.querySelectorAll('.items-list').forEach(list => list.style.display = 'none');
        document.getElementById(listId).style.display = 'block';

        document.querySelectorAll('#list-actions .btn').forEach(btn => btn.style.display = 'none');
        if (listId === 'incomesList') document.getElementById('openAddIncomeModalBtn').style.display = 'flex';
        else if (listId === 'expensesList') document.getElementById('openAddExpenseModalBtn').style.display = 'flex';
        else if (listId === 'shoppingList') document.getElementById('openAddShoppingModalBtn').style.display = 'flex';
        else if (listId === 'avulsosList') document.getElementById('openAddAvulsoModalBtn').style.display = 'flex';
    });
    
    document.getElementById('openAddIncomeModalBtn').addEventListener('click', () => setupAddModal('income'));
    document.getElementById('openAddExpenseModalBtn').addEventListener('click', () => setupAddModal('expense'));
    document.getElementById('openAddShoppingModalBtn').addEventListener('click', () => setupAddModal('shopping'));
    document.getElementById('openAddAvulsoModalBtn').addEventListener('click', () => setupAddModal('avulso'));
    document.getElementById('openAddGoalModalBtn').addEventListener('click', () => setupGoalModal());
    document.getElementById('openAddAccountModalBtn').addEventListener('click', () => setupAccountModal());

    document.getElementById('closeAddModalBtn').addEventListener('click', () => closeModal(elements.addModal));
    document.getElementById('cancelAddBtn').addEventListener('click', () => closeModal(elements.addModal));
    document.getElementById('closeEditModalBtn').addEventListener('click', () => closeModal(elements.editModal));
    document.getElementById('cancelEditBtn').addEventListener('click', () => closeModal(elements.editModal));
    document.getElementById('closeAiModalBtn').addEventListener('click', () => closeModal(elements.aiModal));
    document.getElementById('closeGoalModalBtn').addEventListener('click', () => closeModal(elements.goalModal));
    document.getElementById('cancelGoalBtn').addEventListener('click', () => closeModal(elements.goalModal));
    document.getElementById('closeAccountModalBtn').addEventListener('click', () => closeModal(elements.accountModal));
    document.getElementById('cancelAccountBtn').addEventListener('click', () => closeModal(elements.accountModal));

    elements.addForm.addEventListener('submit', handleAddFormSubmit);
    elements.editForm.addEventListener('submit', handleEditFormSubmit);
    elements.goalForm.addEventListener('submit', handleGoalFormSubmit);
    elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
    elements.aiChatForm.addEventListener('submit', handleAiChatFormSubmit);

    document.querySelector('.lists-container').addEventListener('click', e => {
        const checkBtn = e.target.closest('.check-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (checkBtn) {
            handleTogglePaid(checkBtn.dataset.id, checkBtn.dataset.type);
        } else if (editBtn) {
            setupEditModal(editBtn.dataset.id, editBtn.dataset.type);
        } else if (deleteBtn) {
            const type = deleteBtn.dataset.type;
            const listName = type.endsWith('e') ? `${type}s` : `${type}Items`;
            handleDelete(deleteBtn.dataset.id, type, listName);
        }
    });

    elements.goalsList.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-goal-btn');
        const deleteBtn = e.target.closest('.delete-goal-btn');
        if (editBtn) setupGoalModal(editBtn.dataset.id);
        if (deleteBtn) handleDelete(deleteBtn.dataset.id, 'goal', 'goals');
    });
    
    elements.bankAccountsList.addEventListener('click', e => {
        const editBtn = e.target.closest('.edit-account-btn');
        const deleteBtn = e.target.closest('.delete-account-btn');
        if (editBtn) setupAccountModal(editBtn.dataset.id);
        if (deleteBtn) handleDelete(deleteBtn.dataset.id, 'account', 'bankAccounts');
    });

    ['amount', 'editAmount', 'goalAmount', 'accountBalance'].forEach(id => {
        document.getElementById(id).addEventListener('blur', e => {
            if(!e.target.value) return;
            const value = parseCurrency(e.target.value);
            e.target.value = formatCurrency(value);
        });
        document.getElementById(id).addEventListener('focus', e => {
            if(parseCurrency(e.target.value) === 0) {
                e.target.value = '';
            }
        });
    });

    elements.syncBtn.addEventListener('click', saveDataToFirestore);
}

function initApp() {
    console.log("Initializing App (Definitive Fix v2)...");
    
    // Step 1: Immediately render the correct local data. This is guaranteed to show the right information first.
    console.log("Step 1: Forcing render of local November 2025 data.");
    currentMonthData = initialMonthData;
    updateMonthDisplay();
    updateUI();

    // Step 2: Set up all UI interactions.
    console.log("Step 2: Setting up UI event listeners.");
    populateCategorySelects();
    addEventListeners();
    setupPwaInstall();
    
    // Step 3: Connect to Firebase in the background to sync and correct the cloud data if needed.
    console.log("Step 3: Connecting to Firebase for background sync and data correction.");
    initFirebaseAuthAndSync();
}

document.addEventListener('DOMContentLoaded', initApp);
