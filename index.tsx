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
// INITIAL DATA (CORRECTED)
// =================================================================================
const initialMonthData = {
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
        { id: "exp_nov_14", description: "EMPRÉSTIMO PARA ACABAR DE PASSAR ABRIL (MARCIA BRITO)", amount: 220.00, type: "fixed", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-25', paidDate: null, current: 6, total: 6 },
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
        { id: "exp_nov_33", description: "EMPRÉSTIMO DA TIA CÉLIA", amount: 400.00, type: "variable", category: "dividas", paid: false, cyclic: false, dueDate: '2025-11-30', paidDate: null, current: 8, total: 10 }
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
let currentMonthData = { incomes: [], expenses: [], shoppingItems: [], avulsosItems: [], goals: [], bankAccounts: [] };
let currentModalType = '';
let currentMonth = 11;
let currentYear = 2025;
let deferredPrompt;

// =================================================================================
// FIREBASE SYNC STATE
// =================================================================================
let currentUser = null;
let firestoreUnsubscribe = null;
let isSyncing = false;
let syncStatus = 'disconnected'; // 'disconnected', 'syncing', 'synced', 'error'
let syncErrorDetails = '';


// =================================================================================
// DOM ELEMENTS
// =================================================================================
const elements = {
    monthDisplay: document.getElementById('monthDisplay'),
    
    // Home screen cards
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


    // Lists and other elements
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
// DATA HANDLING (FIREBASE ONLY)
// =================================================================================
async function saveDataToFirestore() {
    if (!currentUser || !isConfigured) {
        return;
    }
    if (isSyncing) return;

    isSyncing = true;
    syncStatus = 'syncing';
    updateSyncButtonState();

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);

    try {
        await setDoc(docRef, currentMonthData);
        syncStatus = 'synced';
        updateLastSyncTime(true);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        syncStatus = 'error';
        alert("Não foi possível salvar os dados na nuvem. Verifique sua conexão com a internet.");
    } finally {
        isSyncing = false;
        updateSyncButtonState();
    }
}


function saveData() {
    updateUI();
    saveDataToFirestore();
}

function loadDataForCurrentMonth() {
    if (!currentUser || !isConfigured) return;
    
    if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
    }

    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    
    firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            console.log(`[Firestore] Data received for ${monthKey}`);
            currentMonthData = docSnap.data();
            updateUI();
        } else {
            console.log(`[Firestore] No data for ${monthKey}, creating new month.`);
            createNewMonthData();
        }
        updateMonthDisplay();
    }, (error) => {
        console.error("Error listening to Firestore:", error);
        syncStatus = 'error';
        updateSyncButtonState();
        alert("Erro de conexão com o banco de dados. Tentando reconectar...");
    });
}


async function createNewMonthData() {
    console.log("[Data] Creating new month data...");
    if (!currentUser || !isConfigured) return;

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    let baseData = null;
    const prevDocRef = doc(db, 'users', currentUser.uid, 'months', previousMonthKey);
    const prevDocSnap = await getDoc(prevDocRef);
    if (prevDocSnap.exists()) {
        baseData = prevDocSnap.data();
    }

    if (!baseData || typeof baseData !== 'object') {
        baseData = { incomes: [], expenses: [], shoppingItems: [], avulsosItems: [], goals: [], bankAccounts: [] };
    }
    
    // FIX: Safely clone arrays to avoid circular reference errors by creating new plain objects.
    const clonedBankAccounts = (baseData.bankAccounts || []).map(acc => ({...acc}));
    const clonedGoals = (baseData.goals || []).map(goal => ({...goal}));

    const newMonthData = {
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
    
    if (currentYear === 2025 && currentMonth === 12) {
        newMonthData.incomes.push(
            { id: `inc_13_marcelly_${Date.now()}`, description: 'SEGUNDA PARCELA 13º SALÁRIO MARCELLY', amount: 3349.92 / 2, paid: false },
            { id: `inc_13_andre_${Date.now()}`, description: 'SEGUNDA PARCELA 13º SALÁRIO ANDRÉ', amount: 3349.92 / 2, paid: false }
        );
    }

    (baseData.expenses || []).forEach(expense => {
        let shouldAdd = false;
        const newExpense = { ...expense, id: `exp_${Date.now()}_${Math.random()}`, paid: false, paidDate: null };
        
        if (expense.total > 1 && expense.current < expense.total) {
            newExpense.current += 1;
            shouldAdd = true;
        } else if (expense.cyclic) {
            if (expense.total <= 1) newExpense.current = 1; 
            shouldAdd = true;
        }

        if(shouldAdd) {
            const newDate = new Date(newExpense.dueDate + 'T00:00:00');
            newDate.setMonth(newDate.getMonth() + 1);
            newExpense.dueDate = newDate.toISOString().split('T')[0];
            newMonthData.expenses.push(newExpense);
        }
    });

    currentMonthData = newMonthData;
    saveData();
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    loadDataForCurrentMonth();
}

// =================================================================================
// SYNC UI
// =================================================================================

function updateProfilePage() {
    const syncStatusText = document.getElementById('sync-status-text');
    const userIdText = document.getElementById('user-id-text');
    const userIdContainer = document.getElementById('user-id-container');
    const syncStatusInfo = document.getElementById('sync-status-info');

    if (currentUser) {
        userIdText.textContent = currentUser.uid;
        userIdContainer.style.display = 'block';
    } else {
         userIdContainer.style.display = 'none';
    }

    if (!isConfigured) {
        syncStatusText.textContent = 'Nuvem Não Configurada';
        syncStatusText.style.color = 'var(--text-light)';
        if (syncStatusInfo) {
            syncStatusInfo.innerHTML = `Seus dados não estão sendo salvos. Para habilitar a sincronização na nuvem e acessar de qualquer lugar, configure suas credenciais no arquivo <code>firebase-config.js</code>.`;
        }
        return;
    }

    if (syncStatus === 'synced') {
        syncStatusText.textContent = 'Conectado e Sincronizado';
        syncStatusText.style.color = 'var(--success)';
        if (syncStatusInfo) syncStatusInfo.innerHTML = 'Seus dados são salvos automaticamente na nuvem, permitindo o acesso de qualquer dispositivo.';
    } else if (syncStatus === 'syncing') {
         syncStatusText.textContent = 'Sincronizando...';
         syncStatusText.style.color = 'var(--warning)';
         if (syncStatusInfo) syncStatusInfo.innerHTML = 'Enviando as últimas alterações para a nuvem...';
    } else if (syncStatus === 'error') {
         syncStatusText.textContent = 'Erro de Configuração';
         syncStatusText.style.color = 'var(--danger)';
         if (syncStatusInfo) {
             if(syncErrorDetails) {
                 syncStatusInfo.innerHTML = syncErrorDetails;
             } else {
                 syncStatusInfo.innerHTML = 'Ocorreu um erro ao sincronizar com a nuvem. Verifique sua conexão com a internet.';
             }
         }
    } else {
         syncStatusText.textContent = 'Desconectado';
         syncStatusText.style.color = 'var(--text-light)';
         if (syncStatusInfo) syncStatusInfo.innerHTML = 'Tentando conectar com a nuvem...';
    }
}

function updateSyncButtonState() {
    if (!elements.syncBtn) return;
    
    if (!isConfigured) {
        elements.syncBtn.innerHTML = ICONS.cloudOff;
        elements.syncBtn.title = 'App não configurado para sincronizar. Siga as instruções em firebase-config.js.';
        elements.syncBtn.style.display = 'flex';
        elements.syncBtn.classList.remove('syncing', 'unsynced', 'sync-error');
        elements.syncBtn.disabled = true;
        return;
    }
    
    elements.syncBtn.style.display = 'flex';
    elements.syncBtn.classList.remove('syncing', 'unsynced', 'sync-error');
    elements.syncBtn.disabled = true; // Button is now just an indicator

    if (isSyncing || syncStatus === 'syncing') {
        elements.syncBtn.innerHTML = ICONS.sync;
        elements.syncBtn.title = 'Sincronizando...';
        elements.syncBtn.classList.add('syncing');
    } else if (syncStatus === 'error') {
        elements.syncBtn.innerHTML = ICONS.info;
        elements.syncBtn.title = 'Erro na sincronização. Verifique a conexão.';
        elements.syncBtn.classList.add('sync-error');
    } else { // 'synced' or 'disconnected'
        elements.syncBtn.innerHTML = ICONS.cloudCheck;
        const lastSync = localStorage.getItem('lastSync');
        const lastSyncTime = lastSync ? new Date(lastSync).toLocaleTimeString('pt-BR') : 'agora';
        elements.syncBtn.title = `Sincronizado. Última vez em: ${lastSyncTime}`;
    }
}


function updateLastSyncTime(isSuccess) {
    if (isSuccess) {
        const now = new Date();
        localStorage.setItem('lastSync', now.toISOString());
    }
}

// =================================================================================
// NAVIGATION
// =================================================================================
function navigateTo(viewName) {
    elements.appViews.forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const showMonthSelector = ['home', 'lancamentos', 'metas'].includes(viewName);
    elements.monthSelector.style.display = showMonthSelector ? 'flex' : 'none';

    if (viewName === 'perfil') {
        updateProfilePage();
    }
}

// =================================================================================
// UI RENDERING
// =================================================================================
function updateUI() {
    if(!currentUser) return; // Don't render if not logged in
    updateSummary();
    renderList('incomes', elements.incomesList, createIncomeItem, "Nenhuma entrada registrada", ICONS.income);
    renderList('expenses', elements.expensesList, createExpenseItem, "Nenhuma despesa registrada", ICONS.expense, true);
    renderList('shoppingItems', elements.shoppingList, createShoppingItem, "Nenhuma compra registrada", ICONS.shopping);
    renderList('avulsosItems', elements.avulsosList, createShoppingItem, "Nenhuma despesa avulsa registrada", ICONS.variable);
    renderGoalsPage();
    renderBankAccounts();
    renderOverviewChart();
}

function updateSummary() {
    // Calculations
    const allIncomes = currentMonthData.incomes || [];
    const allExpenses = currentMonthData.expenses || [];
    const allShopping = currentMonthData.shoppingItems || [];
    const allAvulsos = currentMonthData.avulsosItems || [];

    const totalIncome = allIncomes.reduce((sum, item) => sum + item.amount, 0);
    const salaryIncome = allIncomes
        .filter(item => item.description.toUpperCase().includes('SALARIO'))
        .reduce((sum, item) => sum + item.amount, 0);
    const mumbucaIncome = allIncomes
        .filter(item => item.description.toUpperCase().includes('MUMBUCA'))
        .reduce((sum, item) => sum + item.amount, 0);
    
    // Mumbuca spending now includes shopping list items and specific expenses
    const mumbucaExpenses = allExpenses.filter(item => item.category === 'abastecimento_mumbuca');
    const totalMumbucaSpending = mumbucaExpenses.reduce((sum, item) => sum + item.amount, 0);

    // Expenses to be paid from Salary (all expenses EXCEPT mumbuca fuel)
    const expensesFromSalary = [...allExpenses.filter(item => item.category !== 'abastecimento_mumbuca'), ...allShopping];
    const totalPlannedExpenses = expensesFromSalary.reduce((sum, item) => sum + item.amount, 0);
    const totalPaidExpenses = expensesFromSalary
        .filter(item => item.paid)
        .reduce((sum, item) => sum + item.amount, 0);
    
    const totalAvulsosSpending = allAvulsos.reduce((sum, item) => sum + item.amount, 0);

    // This is the total committed spending for the month from all sources.
    const totalCommittedSpending = totalPlannedExpenses + totalMumbucaSpending; 
    
    // Final balance is Salary minus salary-paid debts and one-offs
    const finalBalance = salaryIncome - totalPlannedExpenses - totalAvulsosSpending;

    // Progress percentages
    const totalIncomeProgress = totalIncome > 0 ? (totalCommittedSpending / totalIncome) * 100 : 0;
    const salaryIncomeProgress = salaryIncome > 0 ? (totalPlannedExpenses / salaryIncome) * 100 : 0;
    const mumbucaIncomeProgress = mumbucaIncome > 0 ? (totalMumbucaSpending / mumbucaIncome) * 100 : 0;
    const monthlyDebtsProgress = totalPlannedExpenses > 0 ? (totalPaidExpenses / totalPlannedExpenses) * 100 : 0;
    
    // Update Total Income Card
    elements.totalIncome.textContent = formatCurrency(totalIncome);
    elements.totalIncomeProgressBar.style.width = `${Math.min(totalIncomeProgress, 100)}%`;
    elements.totalIncomeSubtitle.textContent = `${formatCurrency(totalCommittedSpending)} gastos de ${formatCurrency(totalIncome)}`;

    // Update Salary Income Card
    elements.salaryIncome.textContent = formatCurrency(salaryIncome);
    elements.salaryIncomeProgressBar.style.width = `${Math.min(salaryIncomeProgress, 100)}%`;
    elements.salaryIncomeSubtitle.textContent = `${formatCurrency(totalPlannedExpenses)} gastos de ${formatCurrency(salaryIncome)}`;
    
    // Update Mumbuca Income Card
    elements.mumbucaIncome.textContent = formatCurrency(mumbucaIncome);
    elements.mumbucaIncomeProgressBar.style.width = `${Math.min(mumbucaIncomeProgress, 100)}%`;
    elements.mumbucaIncomeSubtitle.textContent = `${formatCurrency(totalMumbucaSpending)} gastos de ${formatCurrency(mumbucaIncome)}`;
    
    // Update Monthly Debts Card (now only shows salary-based debts)
    elements.monthlyDebts.textContent = formatCurrency(totalPlannedExpenses);
    elements.monthlyDebtsProgressBar.style.width = `${Math.min(monthlyDebtsProgress, 100)}%`;
    elements.monthlyDebtsSubtitle.textContent = `${formatCurrency(totalPaidExpenses)} pagos de ${formatCurrency(totalPlannedExpenses)}`;
    
    // Update Final Balance Card
    elements.finalBalance.textContent = formatCurrency(finalBalance);
    elements.finalBalanceSubtitle.textContent = `Salário - Dívidas - Avulsos`;
}

function updateMonthDisplay() {
    elements.monthDisplay.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
}

function renderList(type, listElement, itemCreator, emptyMessage, emptyIcon, groupByCat = false) {
    listElement.innerHTML = '';
    const items = currentMonthData[type] || [];

    if (items.length === 0) {
        listElement.innerHTML = `<div class="empty-state">${emptyIcon}<div>${emptyMessage}</div></div>`;
        return;
    }
    
    if (groupByCat) {
        const fixed = items.filter(i => i.type === 'fixed');
        const variable = items.filter(i => i.type === 'variable');
        
        if (fixed.length > 0) {
            const header = document.createElement('div');
            header.className = 'item-header';
            header.innerHTML = `${ICONS.fixed} Despesas Fixas`;
            listElement.appendChild(header);
            fixed.sort((a,b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate)).forEach(item => listElement.appendChild(itemCreator(item, type)));
        }

        if (variable.length > 0) {
            const header = document.createElement('div');
            header.className = 'item-header';
            header.innerHTML = `${ICONS.variable} Despesas Variáveis`;
            listElement.appendChild(header);
            variable.sort((a,b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate)).forEach(item => listElement.appendChild(itemCreator(item, type)));
        }

    } else {
        items.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate)).forEach(item => listElement.appendChild(itemCreator(item, type)));
    }
}

function createIncomeItem(income, type) {
    const item = document.createElement('div');
    item.className = 'item';
    item.onclick = () => openEditModal(income.id, type);
    item.innerHTML = `
        <div class="item-content">
            <div class="item-details">
                <div class="item-description">${income.description}</div>
            </div>
        </div>
        <div class="item-actions">
            <span class="item-amount income-amount">${formatCurrency(income.amount)}</span>
            <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
            <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
        </div>
    `;
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(income.id, type); };
    return item;
}

function createExpenseItem(expense, type) {
    const item = document.createElement('div');
    const isFinal = expense.current === expense.total;
    const isOverdue = expense.dueDate && !expense.paid && new Date(expense.dueDate) < new Date();
    
    let dateInfo = '';
    if (expense.paid && expense.paidDate) {
        dateInfo = `<span class="item-paid-date">${ICONS.check} Pago em ${formatDate(expense.paidDate)}</span>`;
    } else if (expense.dueDate) {
        dateInfo = `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(expense.dueDate)}</span>`;
    }

    const isInvestment = expense.description?.toUpperCase().includes('INVESTIMENTO PARA VIAGEM');
    const checkTitle = isInvestment
        ? (expense.paid ? 'Cancelar Check-in do Investimento' : 'Fazer Check-in do Investimento')
        : (expense.paid ? 'Marcar como pendente' : 'Marcar como pago');

    item.className = 'item';
    item.onclick = () => openEditModal(expense.id, type);
    
    item.innerHTML = `
        <button class="check-btn ${expense.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper">
            <div class="item-primary-info">
                <div class="item-description ${expense.paid ? 'paid' : ''}">${expense.description}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
            <div class="item-secondary-info">
                 <div class="item-meta">
                    <span class="item-type type-${expense.type}">${expense.type === 'fixed' ? 'Fixo' : 'Variável'}</span>
                    ${expense.total > 1 ? `<span class="item-installments ${isFinal ? 'final-installment' : ''}">${expense.current}/${expense.total}</span>` : ''}
                </div>
                <div class="item-amount expense-amount">${formatCurrency(expense.amount)}</div>
            </div>
            <div class="item-tertiary-info">
                ${dateInfo}
            </div>
        </div>
    `;

    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(expense.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(expense.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(expense.id, type); };
    
    return item;
}

function createShoppingItem(itemData, type) {
    const item = document.createElement('div');
    const isOverdue = itemData.dueDate && !itemData.paid && new Date(itemData.dueDate) < new Date();

    let dateInfo = '';
    if (itemData.paid && itemData.paidDate) {
        dateInfo = `<span class="item-paid-date">${ICONS.check} Pago em ${formatDate(itemData.paidDate)}</span>`;
    } else if (itemData.dueDate) {
        dateInfo = `<span class="item-due-date ${isOverdue ? 'overdue' : ''}">${ICONS.calendar} Vence em ${formatDate(itemData.dueDate)}</span>`;
    }
    
    const checkTitle = itemData.paid ? 'Marcar como pendente' : 'Marcar como pago';

    item.className = 'item';
    item.onclick = () => openEditModal(itemData.id, type);
    
    item.innerHTML = `
        <button class="check-btn ${itemData.paid ? 'paid' : ''}" title="${checkTitle}">${ICONS.check}</button>
        <div class="item-info-wrapper">
            <div class="item-primary-info">
                <div class="item-description ${itemData.paid ? 'paid' : ''}">${itemData.description}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                    <button class="action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                </div>
            </div>
            <div class="item-secondary-info">
                 <div class="item-meta">
                    ${dateInfo}
                </div>
                <div class="item-amount expense-amount">${formatCurrency(itemData.amount)}</div>
            </div>
        </div>
    `;

    item.querySelector('.check-btn').onclick = (e) => { e.stopPropagation(); togglePaid(itemData.id, type); };
    item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); deleteItem(itemData.id, type); };
    item.querySelector('.edit-btn').onclick = (e) => { e.stopPropagation(); openEditModal(itemData.id, type); };
    
    return item;
}

function renderOverviewChart() {
    const allExpenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);

    if (elements.overviewChart) {
        let overviewHTML = '';
        if (totalExpenses > 0) {
            overviewHTML += createPieChart();

            const marciaBritoDebt = allExpenses
                .filter(expense => expense.description.toUpperCase().includes('MARCIA BRITO'))
                .reduce((sum, expense) => sum + expense.amount, 0);
            
            if (marciaBritoDebt > 0) {
                overviewHTML += `
                    <div class="debt-summary">
                        <div class="debt-summary-header">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>Total a pagar para</span>
                        </div>
                        <div class="debt-summary-title">Marcia Brito</div>
                        <div class="debt-summary-amount">${formatCurrency(marciaBritoDebt)}</div>
                    </div>
                `;
            }
        } else {
            overviewHTML = `
                <div class="chart-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                    Sem dados de despesas para exibir o gráfico.
                </div>
            `;
        }
        elements.overviewChart.innerHTML = overviewHTML;
    }
}

// =================================================================================
// EVENT HANDLERS & ACTIONS
// =================================================================================
function togglePaid(itemId, type) {
    const items = currentMonthData[type];
    if (!items) return;

    const item = items.find(i => i.id === itemId);
    if (item) {
        item.paid = !item.paid;
        if (item.paid) {
            item.paidDate = new Date().toISOString().split('T')[0];
        } else {
            item.paidDate = null;
        }
        saveData();
    }
}

function deleteItem(itemId, type) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    currentMonthData[type] = currentMonthData[type].filter(i => i.id !== itemId);
    saveData();
}

function openAddModal(type) {
    currentModalType = type;
    elements.addForm.reset();
    
    const isExpense = type === 'expenses';

    elements.typeGroup.style.display = isExpense ? 'block' : 'none';
    elements.categoryGroup.style.display = isExpense ? 'block' : 'none';
    elements.installmentsGroup.style.display = isExpense ? 'flex' : 'none';
    elements.dueDateGroup.style.display = isExpense ? 'block' : 'none';
    document.getElementById('cyclicGroup').style.display = isExpense ? 'flex' : 'none';
    
    let title = 'Nova Receita';
    if (isExpense) title = 'Nova Despesa';
    if (type === 'shoppingItems') title = 'Nova Compra com Mumbuca';
    if (type === 'avulsosItems') {
        title = 'Nova Despesa Avulsa';
        elements.categoryGroup.style.display = 'block'; // Also show category for Avulsos
    }


    elements.addModalTitle.textContent = title;
    elements.addModal.classList.add('active');
    document.getElementById('description').focus();
}

function openEditModal(itemId, type) {
    const items = currentMonthData[type];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    elements.editForm.reset();
    elements.editItemId.value = itemId;
    elements.editItemType.value = type;
    elements.editDescription.value = item.description;
    elements.editAmount.value = formatCurrency(item.amount).replace('R$', '').trim();
    
    const isExpense = type === 'expenses';
    const isShoppingOrAvulso = type === 'shoppingItems' || type === 'avulsosItems';
    
    elements.editCategoryGroup.style.display = isExpense || type === 'avulsosItems' ? 'block' : 'none';
    elements.editDueDateGroup.style.display = isExpense ? 'block' : 'none';
    elements.editPaidDateGroup.style.display = isExpense || isShoppingOrAvulso ? 'block' : 'none';
    elements.editInstallmentsGroup.style.display = isExpense && item.total > 1 ? 'flex' : 'none';
    elements.editInstallmentsInfo.style.display = isExpense && item.total > 1 ? 'flex' : 'none';

    if (isExpense) {
        elements.editCategory.value = item.category || '';
        elements.editDueDate.value = item.dueDate || '';
        elements.editCurrentInstallment.value = item.current || 1;
        elements.editTotalInstallments.value = item.total || 1;
    }
    if(type === 'avulsosItems') {
         elements.editCategory.value = item.category || 'outros';
    }
    
    if (item.paidDate) {
         elements.editPaidDate.value = item.paidDate;
         elements.editPaidDateGroup.style.display = 'block';
    } else {
        elements.editPaidDateGroup.style.display = 'none';
    }

    let title = 'Editar Receita';
    if (isExpense) title = 'Editar Despesa';
    if (type === 'shoppingItems') title = 'Editar Compra';
    if (type === 'avulsosItems') title = 'Editar Despesa Avulsa';

    elements.editModalTitle.textContent = title;
    elements.editModal.classList.add('active');
}

function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(elements.addForm);
    const amount = parseCurrency(formData.get('amount'));
    if (amount <= 0) {
        alert("O valor deve ser maior que zero.");
        return;
    }
    
    let newItem = {
        id: `${currentModalType}_${Date.now()}`,
        description: formData.get('description'),
        amount: amount,
        paid: false,
    };
    
    if (currentModalType === 'expenses') {
        newItem = {
            ...newItem,
            type: formData.get('type'),
            category: formData.get('category'),
            paid: false,
            cyclic: formData.get('cyclic') === 'on',
            dueDate: formData.get('dueDate') || null,
            paidDate: null,
            current: parseInt(formData.get('currentInstallment')) || 1,
            total: parseInt(formData.get('totalInstallments')) || 1
        };
    } else if (currentModalType === 'shoppingItems' || currentModalType === 'avulsosItems') {
         newItem = {
            ...newItem,
            paid: true, // Avulsos/Shopping are paid immediately
            paidDate: new Date().toISOString().split('T')[0],
            category: 'shopping'
        };
        if (currentModalType === 'avulsosItems') {
             newItem.category = formData.get('category') || 'outros';
        }
    }

    currentMonthData[currentModalType].push(newItem);
    saveData();
    closeModal(elements.addModal);
}

function handleEditFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(elements.editForm);
    const itemId = formData.get('editItemId');
    const itemType = formData.get('editItemType');
    const amount = parseCurrency(formData.get('editAmount'));
     if (amount <= 0) {
        alert("O valor deve ser maior que zero.");
        return;
    }
    
    const item = currentMonthData[itemType].find(i => i.id === itemId);
    if (item) {
        item.description = formData.get('editDescription');
        item.amount = amount;
        
        if (itemType === 'expenses') {
            item.category = formData.get('editCategory');
            item.dueDate = formData.get('editDueDate');
            item.current = parseInt(formData.get('editCurrentInstallment')) || item.current;
            item.total = parseInt(formData.get('editTotalInstallments')) || item.total;
        }

        if (itemType === 'avulsosItems') {
            item.category = formData.get('editCategory');
        }

        if (itemType === 'expenses' || itemType === 'shoppingItems' || itemType === 'avulsosItems') {
            const newPaidDate = formData.get('editPaidDate');
            if (newPaidDate && newPaidDate !== item.paidDate) {
                item.paidDate = newPaidDate;
                item.paid = true;
            } else if (!newPaidDate) {
                item.paidDate = null;
                item.paid = false;
            }
        }
        
        saveData();
        closeModal(elements.editModal);
    }
}

function renderGoalsPage() {
    const goals = currentMonthData.goals || [];
    const expenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    
    // Add automatic 'Avulsos' goal
    const hasAvulsosGoal = goals.some(g => g.category === 'avulsos');
    let autoAvulsosGoal = null;
    if (!hasAvulsosGoal) {
        const lastMonthSalary = 6699.84; // Hardcoded salary for auto-goal
        const avulsosTarget = lastMonthSalary * 0.07; // 7% of salary
        autoAvulsosGoal = { id: 'goal_auto_avulsos', category: 'avulsos', amount: avulsosTarget, auto: true };
    }

    const allGoals = autoAvulsosGoal ? [autoAvulsosGoal, ...goals] : goals;
    
    elements.goalsList.innerHTML = '';
    if (allGoals.length === 0) {
        elements.goalsList.innerHTML = `<div class="empty-state">${ICONS.goal}<div>Crie metas de gastos para acompanhar seus limites por categoria.</div></div>`;
        return;
    }

    allGoals.sort((a, b) => a.category.localeCompare(b.category)).forEach(goal => {
        let spent = 0;
        if (goal.category === 'avulsos') {
            spent = (currentMonthData.avulsosItems || []).reduce((s, e) => s + e.amount, 0);
        } else {
            spent = expenses.filter(e => e.category === goal.category).reduce((s, e) => s + e.amount, 0);
        }
        
        const progress = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
        const remaining = goal.amount - spent;
        
        let progressClass = 'safe';
        if (progress > 75) progressClass = 'warning';
        if (progress >= 100) progressClass = 'danger';

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-card-header">
                <div class="goal-card-title">
                    ${SPENDING_CATEGORIES[goal.category]?.icon || ICONS.goal}
                    <span>${SPENDING_CATEGORIES[goal.category]?.name || 'Meta'}</span>
                </div>
                <div class="goal-card-actions">
                    ${goal.auto ? `<span class="goal-card-auto-info">Automático</span>` : `
                    <button class="action-btn edit-goal-btn" data-id="${goal.id}">${ICONS.edit}</button>
                    <button class="action-btn delete-goal-btn" data-id="${goal.id}">${ICONS.delete}</button>
                    `}
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
        
        if (!goal.auto) {
            card.querySelector('.edit-goal-btn').onclick = () => openGoalModal(goal.id);
            card.querySelector('.delete-goal-btn').onclick = () => deleteGoal(goal.id);
        }

        elements.goalsList.appendChild(card);
    });
}

function openGoalModal(goalId = null) {
    elements.goalForm.reset();
    if (goalId) {
        const goal = currentMonthData.goals.find(g => g.id === goalId);
        if (goal) {
            elements.goalModalTitle.textContent = 'Editar Meta';
            elements.goalId.value = goal.id;
            elements.goalCategory.value = goal.category;
            elements.goalAmount.value = formatCurrency(goal.amount).replace('R$', '').trim();
            elements.goalCategory.disabled = true;
        }
    } else {
        elements.goalModalTitle.textContent = 'Nova Meta';
        elements.goalId.value = '';
        elements.goalCategory.disabled = false;
    }
    elements.goalModal.classList.add('active');
}

function handleGoalFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(elements.goalForm);
    const id = formData.get('goalId');
    const category = formData.get('goalCategory');
    const amount = parseCurrency(formData.get('goalAmount'));

    if (currentMonthData.goals.some(g => g.category === category && g.id !== id)) {
        alert('Já existe uma meta para esta categoria.');
        return;
    }

    if (id) { // Editing
        const goal = currentMonthData.goals.find(g => g.id === id);
        if (goal) goal.amount = amount;
    } else { // Adding
        currentMonthData.goals.push({ id: `goal_${Date.now()}`, category, amount });
    }
    saveData();
    closeModal(elements.goalModal);
}

function deleteGoal(goalId) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    currentMonthData.goals = currentMonthData.goals.filter(g => g.id !== goalId);
    saveData();
}

function renderBankAccounts() {
    elements.bankAccountsList.innerHTML = '';
    const accounts = currentMonthData.bankAccounts || [];
    let totalBalance = 0;

    if (accounts.length === 0) {
        elements.bankAccountsList.innerHTML = `<div class="empty-state-small">${ICONS.investment}<div>Adicione suas contas para ver o saldo total.</div></div>`;
    } else {
         accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'account-item';
            item.onclick = () => openAccountModal(acc.id);
            item.innerHTML = `
                <div class="account-name">${acc.name}</div>
                <div class="account-balance ${acc.balance < 0 ? 'balance-negative' : ''}">${formatCurrency(acc.balance)}</div>
            `;
            elements.bankAccountsList.appendChild(item);
            totalBalance += acc.balance;
        });
    }

    const totalAmountEl = document.getElementById('accounts-total-amount');
    totalAmountEl.textContent = formatCurrency(totalBalance);
    totalAmountEl.className = totalBalance < 0 ? 'balance-negative' : '';
}

function openAccountModal(accountId = null) {
    elements.accountForm.reset();
    if (accountId) {
        const account = currentMonthData.bankAccounts.find(a => a.id === accountId);
        if (account) {
            elements.accountModalTitle.textContent = 'Editar Conta';
            elements.accountId.value = account.id;
            elements.accountName.value = account.name;
            elements.accountBalance.value = formatCurrency(account.balance).replace('R$', '').trim();
        }
    } else {
        elements.accountModalTitle.textContent = 'Nova Conta';
        elements.accountId.value = '';
    }
    elements.accountModal.classList.add('active');
}

function handleAccountFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(elements.accountForm);
    const id = formData.get('accountId');
    const name = formData.get('accountName');
    const balance = parseCurrency(formData.get('accountBalance'));

    if (id) {
        const account = currentMonthData.bankAccounts.find(a => a.id === id);
        if (account) {
            account.name = name;
            account.balance = balance;
        }
    } else {
        currentMonthData.bankAccounts.push({ id: `acc_${Date.now()}`, name, balance });
    }
    saveData();
    closeModal(elements.accountModal);
}

function deleteAccount(accountId) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    currentMonthData.bankAccounts = currentMonthData.bankAccounts.filter(a => a.id !== accountId);
    saveData();
}

async function openAiModal() {
    elements.aiModal.classList.add('active');
    
    if (!chat) {
        elements.aiAnalysis.innerHTML = '<div class="ai-message"><div class="message-bubble">Iniciando assistente de IA...</div></div>';
        
        const financialSummary = `
            **Resumo Financeiro de ${getMonthName(currentMonth)} ${currentYear}:**
            - **Receita Total:** ${formatCurrency((currentMonthData.incomes || []).reduce((s, i) => s + i.amount, 0))}
            - **Despesas Totais:** ${formatCurrency([...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])].reduce((s, e) => s + e.amount, 0))}
            - **Saldo Final Previsto:** ${elements.finalBalance.textContent}
            - **Despesas Pendentes:** ${(currentMonthData.expenses || []).filter(e => !e.paid).length} itens.
        `;

        try {
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `Você é um assistente financeiro especialista em finanças pessoais para brasileiros. Seu nome é Fin. Analise os dados fornecidos e responda às perguntas do usuário de forma clara, objetiva e amigável. Use emojis para tornar a conversa mais leve. O resumo financeiro do mês atual é:\n${financialSummary}`
                }
            });
            const response = await chat.sendMessage({ message: "Faça uma breve análise da minha situação financeira este mês e me dê uma dica importante." });
            elements.aiAnalysis.innerHTML = `<div class="ai-message"><div class="message-bubble">${simpleMarkdownToHtml(response.text)}</div></div>`;
        } catch (error) {
            console.error("Gemini API Error:", error);
            elements.aiAnalysis.innerHTML = '<div class="ai-message"><div class="message-bubble">Desculpe, não consegui me conectar. Verifique se a chave de API está configurada corretamente.</div></div>';
        }
    }
}

async function sendAiChatMessage(event) {
    event.preventDefault();
    if (!chat) return;

    const userInput = elements.aiChatInput.value.trim();
    if (!userInput) return;
    
    elements.aiAnalysis.innerHTML += `<div class="user-message"><div class="message-bubble">${userInput}</div></div>`;
    elements.aiChatInput.value = '';
    elements.aiChatForm.querySelector('button').disabled = true;
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-message';
    typingIndicator.innerHTML = `<div class="message-bubble">Fin está digitando...</div>`;
    elements.aiAnalysis.appendChild(typingIndicator);
    elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
    
    try {
        const response = await chat.sendMessage({ message: userInput });
        typingIndicator.remove();
        elements.aiAnalysis.innerHTML += `<div class="ai-message"><div class="message-bubble">${simpleMarkdownToHtml(response.text)}</div></div>`;
    } catch (error) {
        typingIndicator.innerHTML = `<div class="message-bubble">Ocorreu um erro. Tente novamente.</div>`;
    } finally {
        elements.aiChatForm.querySelector('button').disabled = false;
        elements.aiAnalysis.scrollTop = elements.aiAnalysis.scrollHeight;
    }
}

function createPieChart() {
    const expenses = [...(currentMonthData.expenses || []), ...(currentMonthData.shoppingItems || []), ...(currentMonthData.avulsosItems || [])];
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);

    const categoryTotals = expenses.reduce((acc, item) => {
        const categoryKey = item.category || 'outros';
        acc[categoryKey] = (acc[categoryKey] || 0) + item.amount;
        return acc;
    }, {});
    
    const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

    const colors = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#60a5fa', '#f97316', '#ec4899', '#64748b'];
    
    let gradientParts = [];
    let currentAngle = 0;
    
    const legendItems = sortedCategories.map(([key, value], index) => {
        const percentage = (value / total) * 100;
        const color = colors[index % colors.length];
        gradientParts.push(`${color} ${currentAngle}deg ${currentAngle + percentage * 3.6}deg`);
        currentAngle += percentage * 3.6;

        return `
            <div class="legend-item">
                <div class="legend-label">
                    <div class="legend-color" style="background-color: ${color};"></div>
                    <span>${SPENDING_CATEGORIES[key]?.name || 'Outros'}</span>
                </div>
                <div class="legend-value">
                    ${formatCurrency(value)}
                    <span class="legend-percentage">(${percentage.toFixed(1)}%)</span>
                </div>
            </div>
        `;
    }).join('');

    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;
    
    return `
        <div class="pie-chart-container">
            <div class="pie-chart" style="background: ${conicGradient};"></div>
            <div class="pie-chart-legend">${legendItems}</div>
        </div>
    `;
}

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
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBanner.classList.remove('visible');
        }
    });

    dismissBtn.addEventListener('click', () => {
        installBanner.classList.remove('visible');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installBanner.classList.remove('visible');
        console.log('PWA was installed');
    });
}
function setupEventListeners() {
    // Navigation
    elements.tabBar.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn && tabBtn.dataset.view) {
            navigateTo(tabBtn.dataset.view);
        }
    });
    
    document.getElementById('openAiModalBtnTab').onclick = openAiModal;
    
    elements.segmentedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.segmentedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const listId = btn.dataset.list;
            document.querySelectorAll('.items-list').forEach(list => {
                list.style.display = list.id === listId ? 'block' : 'none';
            });

            document.querySelectorAll('#list-actions .btn').forEach(actionBtn => {
                actionBtn.style.display = 'none';
            });
            
            if (listId === 'incomesList') document.getElementById('openAddIncomeModalBtn').style.display = 'flex';
            if (listId === 'expensesList') document.getElementById('openAddExpenseModalBtn').style.display = 'flex';
            if (listId === 'shoppingList') document.getElementById('openAddShoppingModalBtn').style.display = 'flex';
            if (listId === 'avulsosList') document.getElementById('openAddAvulsoModalBtn').style.display = 'flex';
        });
    });

    // Month Change
    document.getElementById('prevMonthBtn').onclick = () => changeMonth(-1);
    document.getElementById('nextMonthBtn').onclick = () => changeMonth(1);
    
    // Modal Openers
    document.getElementById('openAddIncomeModalBtn').onclick = () => openAddModal('incomes');
    document.getElementById('openAddExpenseModalBtn').onclick = () => openAddModal('expenses');
    document.getElementById('openAddShoppingModalBtn').onclick = () => openAddModal('shoppingItems');
    document.getElementById('openAddAvulsoModalBtn').onclick = () => openAddModal('avulsosItems');
    document.getElementById('openAddGoalModalBtn').onclick = () => openGoalModal();
    document.getElementById('openAddAccountModalBtn').onclick = () => openAccountModal();

    // Modal Closers & Cancel
    document.getElementById('closeAddModalBtn').onclick = () => closeModal(elements.addModal);
    document.getElementById('cancelAddBtn').onclick = () => closeModal(elements.addModal);
    document.getElementById('closeEditModalBtn').onclick = () => closeModal(elements.editModal);
    document.getElementById('cancelEditBtn').onclick = () => closeModal(elements.editModal);
    document.getElementById('closeAiModalBtn').onclick = () => closeModal(elements.aiModal);
    document.getElementById('closeGoalModalBtn').onclick = () => closeModal(elements.goalModal);
    document.getElementById('cancelGoalBtn').onclick = () => closeModal(elements.goalModal);
    document.getElementById('closeAccountModalBtn').onclick = () => closeModal(elements.accountModal);
    document.getElementById('cancelAccountBtn').onclick = () => closeModal(elements.accountModal);

    // Form Submissions
    elements.addForm.addEventListener('submit', handleFormSubmit);
    elements.editForm.addEventListener('submit', handleEditFormSubmit);
    elements.aiChatForm.addEventListener('submit', sendAiChatMessage);
    elements.goalForm.addEventListener('submit', handleGoalFormSubmit);
    elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
    
    // Currency formatting on input
    ['amount', 'editAmount', 'goalAmount', 'accountBalance'].forEach(id => {
        const input = document.getElementById(id);
        if(input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value) {
                    const numberValue = parseInt(value, 10) / 100;
                    e.target.value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numberValue);
                } else {
                    e.target.value = '';
                }
            });
        }
    });

    // Toggle cyclic based on type for expenses
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            const isFixed = e.target.value === 'fixed';
            document.getElementById('cyclicGroup').style.display = isFixed ? 'flex' : 'none';
        });
    }
}

function initApp() {
    console.log("App initializing...");
    setupPwaInstall();
    populateCategorySelects();
    setupEventListeners();

    if (!isConfigured) {
        syncStatus = 'error';
        syncErrorDetails = `A sincronização na nuvem não está configurada. Siga as instruções no arquivo <code>firebase-config.js</code> para habilitar.`;
        updateSyncButtonState();
        updateProfilePage();
        alert("Atenção: O Firebase não está configurado. O app funcionará apenas localmente, sem salvar seus dados na nuvem.");
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("Usuário anônimo autenticado:", user.uid);
            
            // Special one-time override for November 2025 data correction
            const novemberKey = '2025-11';
            const docRef = doc(db, 'users', currentUser.uid, 'months', novemberKey);
            const docSnap = await getDoc(docRef);
            
            // If Nov data doesn't exist OR it's empty (from a previous bug)
            if (!docSnap.exists() || !docSnap.data().incomes || docSnap.data().incomes.length === 0) {
                 console.log("[Data Correction] Forcing initial data for November 2025.");
                 await setDoc(docRef, initialMonthData);
            }
            
            currentYear = 2025;
            currentMonth = 11;
            loadDataForCurrentMonth();
        } else {
            console.log("Nenhum usuário logado. Tentando login anônimo...");
            signInAnonymously(auth).catch((error) => {
                console.error("Falha no login anônimo:", error);
                syncStatus = 'error';
                if (error.code === 'auth/configuration-not-found') {
                    syncErrorDetails = `<strong>Erro de Configuração:</strong> O método de login "Anônimo" não está ativado no seu projeto Firebase. <br>1. Acesse o <a href="https://console.firebase.google.com/u/0/project/${firebaseConfig.projectId}/authentication/providers" target="_blank">Painel do Firebase</a>. <br>2. Vá para a aba "Método de login". <br>3. Ative o provedor "Anônimo" e salve.`;
                } else {
                    syncErrorDetails = `Ocorreu um erro inesperado na autenticação. (${error.code})`;
                }
                 updateSyncButtonState();
                 updateProfilePage();
            });
        }
    });
}
// Run the app
document.addEventListener('DOMContentLoaded', initApp);
