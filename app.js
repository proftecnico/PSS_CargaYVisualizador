// ---// Firebase Configuration
const firebaseConfig = {
    databaseURL: "https://pssdatabase-66e69-default-rtdb.firebaseio.com/" // User should replace this with their actual Firebase URL
};

// Initialize Firebase
if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
}

class Store {
    constructor() {
        this.key = 'pss_registro_data';
        this.data = this.loadLocal();
        this.db = window.firebase ? firebase.database().ref('pss_data') : null;
        this.role = 'consulta';
        this.onSync = null;
    }

    async init() {
        if (!this.db) {
            this.hideLoading();
            return;
        }

        // Real-time synchronization
        this.db.on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                this.data = cloudData;
                this.saveLocal();
                if (this.onSync) this.onSync();
            } else {
                this.save(); // Migrate local to cloud
            }
            this.hideLoading();
        }, (error) => {
            console.error('Firebase Error:', error);
            this.hideLoading();
        });
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    loadLocal() {
        const saved = localStorage.getItem(this.key);
        return saved ? JSON.parse(saved) : {
            providers: [
                {
                    id: 'p1',
                    name: 'Constructora S.A.',
                    cuit: '30-12345678-9',
                    docs: {
                        cuit: { status: 'ok', expiry: '2025-12-31' },
                        estatuto: { status: 'ok', expiry: '2026-06-30' },
                        aportes: { status: 'ok', expiry: '2024-05-30' },
                        art: { status: 'error', expiry: '2024-01-15' },
                        rc: { status: 'ok', expiry: '2024-11-20' },
                        pss: { status: 'ok', expiry: '2024-09-01' },
                        emergencia: { status: 'ok', expiry: '2025-01-10' },
                        iso: { status: 'warning', expiry: '2024-03-30' },
                        firma: { status: 'ok', expiry: '2025-12-31' }
                    },
                    personnel: [
                        { id: 'per1', name: 'Juan Pérez', authorized: true, docs: { medical: '2024-12-31', safety: '2024-12-31' } },
                        { id: 'per2', name: 'Maria Lopez', authorized: false, docs: { medical: '2023-12-31', safety: '2024-12-31' } }
                    ],
                    vehicles: [
                        { id: 'v1', domain: 'ABC 123', vtv: '2024-12-31', insurance: '2024-12-31' },
                        { id: 'v2', domain: 'OL987MM', vtv: '2023-10-15', insurance: '2024-05-20' }
                    ]
                }
            ]
        };
    }

    saveLocal() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    save() {
        this.saveLocal();
        if (this.db) {
            this.db.set(this.data);
        }
    }

    getProviders() {
        return this.data.providers;
    }

    setRole(role) {
        this.data.role = role;
        this.save();
    }

    getRole() {
        return this.data.role;
    }

    addProvider(provider) {
        this.data.providers.push(provider);
        this.save();
    }

    deleteProvider(providerId) {
        this.data.providers = this.data.providers.filter(p => p.id !== providerId);
        this.save();
    }

    updateDoc(providerId, docKey, expiry) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p && p.docs[docKey]) {
            p.docs[docKey].expiry = expiry;
            this.save();
        }
    }

    deletePersonnel(providerId, personId) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            p.personnel = p.personnel.filter(per => per.id !== personId);
            this.save();
        }
    }

    deleteVehicle(providerId, vehicleId) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            p.vehicles = p.vehicles.filter(v => v.id !== vehicleId);
            this.save();
        }
    }

    updateProvider(providerId, updates) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            Object.assign(p, updates);
            this.save();
        }
    }

    updatePersonnel(providerId, personId, updates) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            const per = p.personnel.find(ps => ps.id === personId);
            if (per) {
                Object.assign(per, updates);
                this.save();
            }
        }
    }

    updateVehicle(providerId, vehicleId, updates) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            const v = p.vehicles.find(vh => vh.id === vehicleId);
            if (v) {
                Object.assign(v, updates);
                this.save();
            }
        }
    }

    addPersonnel(providerId, person) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            p.personnel.push(person);
            this.save();
        }
    }

    checkExpiry(dateStr) {
        if (!dateStr) return 'none';
        const expiry = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'error';
        if (diffDays < 30) return 'warning';
        return 'ok';
    }
}

const store = new Store();

// --- View Logic (formerly main.js) ---
const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');
const roleSelect = document.getElementById('role-select');
const currentUserRole = document.getElementById('current-user-role');

const AppState = {
    currentView: 'dashboard',
    currentProviderId: null,
    searchFilter: ''
};

function renderDashboard() {
    console.log('AppState transition to Dashboard');
    const providers = store.getProviders().filter(p =>
        p.name.toLowerCase().includes(AppState.searchFilter.toLowerCase()) ||
        p.cuit.includes(AppState.searchFilter)
    );
    let totalVencidos = 0;
    let totalAlertas = 0;
    let totalOk = 0;

    providers.forEach(p => {
        if (!p.docs) return;
        Object.values(p.docs).forEach(doc => {
            const status = store.checkExpiry(doc.expiry);
            if (status === 'error') totalVencidos++;
            else if (status === 'warning') totalAlertas++;
            else if (status === 'ok') totalOk++;
        });
    });

    viewContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card vencidos">
                <span class="stat-value">${totalVencidos}</span>
                <span class="stat-label">Documentos Vencidos</span>
            </div>
            <div class="stat-card alertas">
                <span class="stat-value">${totalAlertas}</span>
                <span class="stat-label">Próximos a Vencer</span>
            </div>
            <div class="stat-card al-dia">
                <span class="stat-value">${totalOk}</span>
                <span class="stat-label">En Regla</span>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Estados de Proveedores</h2>
                <div style="position: relative; width: 300px;">
                    <input type="text" id="search-input" placeholder="Buscar por nombre o CUIT..." 
                           style="width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border);"
                           value="${AppState.searchFilter}">
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Proveedor</th>
                        <th>CUIT</th>
                        <th>Estado General</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${providers.map(p => {
        const docValues = p.docs ? Object.values(p.docs) : [];
        const hasError = docValues.some(d => store.checkExpiry(d.expiry) === 'error');
        const statusClass = hasError ? 'danger' : 'success';
        const statusText = hasError ? 'Vencido' : 'Vigente';
        return `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.cuit}</td>
                                <td><span class="badge ${statusClass}">${statusText}</span></td>
                                <td><button class="btn btn-primary" onclick="window.app.handleNav('providerDetail', '${p.id}')">Ver</button></td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(AppState.searchFilter.length, AppState.searchFilter.length);
        searchInput.oninput = (e) => {
            AppState.searchFilter = e.target.value;
            renderDashboard();
        };
    }
}

function renderProviders() {
    console.log('AppState transition to Providers List');
    const providers = store.getProviders();
    const isAdmin = store.getRole() === 'admin';

    viewContainer.innerHTML = `
        <div class="top-actions" style="margin-bottom: 2rem; display: flex; justify-content: flex-end;">
            ${isAdmin ? '<button class="btn btn-primary" onclick="window.app.addProvider()"><i data-lucide="plus"></i> Nuevo Proveedor</button>' : ''}
        </div>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Proveedor</th>
                        <th>CUIT</th>
                        <th>Archivos</th>
                        <th>Personal</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${providers.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.cuit}</td>
                            <td>${p.docs ? Object.keys(p.docs).length : 0}</td>
                            <td>${p.personnel ? p.personnel.length : 0}</td>
                            <td>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn" style="background: #f1f5f9; padding: 0.5rem 1rem;" onclick="window.app.handleNav('providerDetail', '${p.id}')">Gestionar</button>
                                    ${isAdmin ? `
                                        <button class="btn" title="Editar" style="background: #f1f5f9; padding: 0.5rem;" onclick="window.app.editProvider('${p.id}')"><i data-lucide="edit-3" style="width: 16px; height: 16px;"></i></button>
                                        <button class="btn" title="Eliminar" style="background: #fee2e2; color: #991b1b; padding: 0.5rem;" onclick="window.app.deleteProvider('${p.id}')"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function renderProviderDetail(providerId) {
    console.log('AppState transition to Provider Detail:', providerId);
    if (!providerId) {
        viewContainer.innerHTML = `<div class="card">Seleccione un proveedor para ver el detalle.</div>`;
        return;
    }

    const p = store.getProviders().find(p => p.id === providerId);
    if (!p) {
        viewContainer.innerHTML = `<div class="card">Error: Proveedor no encontrado (${providerId})</div>`;
        return;
    }

    viewTitle.textContent = `Detalle: ${p.name}`;
    const isAdmin = store.getRole() === 'admin';

    const docLabels = {
        cuit: 'Constancia AFIP (CUIT)',
        estatuto: 'Estatuto y Poderes',
        aportes: 'Comprobantes de Aportes',
        art: 'Certificado ART',
        rc: 'Seguro Resp. Civil',
        pss: 'Plan de Trabajo y PSS',
        emergencia: 'Protocolos Emergencia',
        iso: 'Certificación ISO',
        firma: 'Firma Digital Representante'
    };

    viewContainer.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <button class="btn" onclick="window.app.handleNav('providers')"><i data-lucide="arrow-left"></i> Volver a Proveedores</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div class="card">
                <h3>Documentación Administrativa y SST</h3>
                <table style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(p.docs || {}).map(([key, doc]) => {
        const status = store.checkExpiry(doc.expiry);
        return `
                                <tr>
                                    <td>${docLabels[key] || key}</td>
                                    <td>${doc.expiry || 'Sin fecha'}</td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <span class="badge ${status === 'ok' ? 'success' : (status === 'none' ? 'muted' : status)}">
                                                ${status === 'ok' ? 'Vigente' : (status === 'warning' ? 'Por Vencer' : (status === 'error' ? 'Vencido' : 'Pendiente'))}
                                            </span>
                                            ${isAdmin ? `<button class="btn" style="padding: 0.25rem; background: #f1f5f9" onclick="window.app.editDoc('${p.id}', '${key}')"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Personal Afectado</h3>
                        ${isAdmin ? `<button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="window.app.addPersonnel('${p.id}')"><i data-lucide="plus"></i> Agregar</button>` : ''}
                    </div>
                    <table style="margin-top: 1rem;">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Estado</th>
                                ${isAdmin ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${(p.personnel || []).map(per => {
        const medStatus = store.checkExpiry(per.docs.medical);
        const safeStatus = store.checkExpiry(per.docs.safety);
        const authorized = medStatus === 'ok' && safeStatus === 'ok';
        return `
                                    <tr>
                                        <td>${per.name}</td>
                                        <td>
                                            <span class="badge ${authorized ? 'success' : 'danger'}">
                                                ${authorized ? 'Autorizado' : 'Denegado'}
                                            </span>
                                        </td>
                                        ${isAdmin ? `
                                            <td>
                                                <div style="display: flex; gap: 0.25rem;">
                                                    <button class="btn" style="padding: 0.25rem; background: #f1f5f9" onclick="window.app.editPersonnel('${p.id}', '${per.id}')"><i data-lucide="edit" style="width: 14px; height: 14px;"></i></button>
                                                    <button class="btn" style="padding: 0.25rem; background: #fee2e2; color: #991b1b" onclick="window.app.deletePersonnel('${p.id}', '${per.id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                                </div>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Flota del Proveedor</h3>
                        ${isAdmin ? `<button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="window.app.addVehicle()"><i data-lucide="plus"></i> Agregar</button>` : ''}
                    </div>
                    <table style="margin-top: 1rem;">
                        <thead>
                            <tr>
                                <th>Dominio</th>
                                <th>VTV</th>
                                <th>Seguro</th>
                                ${isAdmin ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${(p.vehicles || []).map(v => {
        const vtvStatus = store.checkExpiry(v.vtv);
        const insStatus = store.checkExpiry(v.insurance);
        const isOk = vtvStatus === 'ok' && insStatus === 'ok';
        return `
                                    <tr>
                                        <td><strong>${v.domain}</strong></td>
                                        <td><span class="badge ${vtvStatus === 'ok' ? 'success' : vtvStatus}">${v.vtv}</span></td>
                                        <td><span class="badge ${insStatus === 'ok' ? 'success' : insStatus}">${v.insurance}</span></td>
                                        ${isAdmin ? `
                                            <td>
                                                <div style="display: flex; gap: 0.25rem;">
                                                    <button class="btn" style="padding: 0.25rem; background: #f1f5f9" onclick="window.app.editVehicle('${p.id}', '${v.id}')"><i data-lucide="edit" style="width: 14px; height: 14px;"></i></button>
                                                    <button class="btn" style="padding: 0.25rem; background: #fee2e2; color: #991b1b" onclick="window.app.deleteVehicle('${p.id}', '${v.id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                                </div>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

function renderVehicles() {
    console.log('AppState transition to Vehicles');
    const allProviders = store.getProviders();
    const isAdmin = store.getRole() === 'admin';
    const selectedProviderId = AppState.currentProviderId;

    // Determine which providers to show
    const providersToShow = selectedProviderId
        ? allProviders.filter(p => p.id === selectedProviderId)
        : allProviders;

    const isFiltered = !!selectedProviderId;

    viewContainer.innerHTML = `
        <div class="top-actions" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                ${isFiltered ? `
                    <button class="btn" onclick="AppState.currentProviderId = null; window.app.handleNav('vehicles')" style="background: #f1f5f9">
                        <i data-lucide="filter-x"></i> Ver Todos los Proveedores
                    </button>
                ` : ''}
            </div>
            ${isAdmin ? '<button class="btn btn-primary" onclick="window.app.addVehicle()"><i data-lucide="plus"></i> Nuevo Vehículo</button>' : ''}
        </div>
        
        ${providersToShow.length === 0 ? '<div class="card">No hay vehículos registrados para este criterio.</div>' : ''}

        ${providersToShow.map(p => `
            <div class="card" style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                    <h2 style="font-size: 1.25rem; color: var(--primary);">${p.name} <span style="font-weight: normal; color: var(--text-secondary); font-size: 0.875rem;">(CUIT: ${p.cuit})</span></h2>
                    ${isAdmin ? `<button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="AppState.currentProviderId = '${p.id}'; window.app.addVehicle()"><i data-lucide="plus"></i> Agregar</button>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Dominio</th>
                            <th>VTV</th>
                            <th>Seguro</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(p.vehicles || []).length === 0 ? '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Sin vehículos registrados</td></tr>' :
            (p.vehicles || []).map(v => {
                const vtvStatus = store.checkExpiry(v.vtv);
                const insStatus = store.checkExpiry(v.insurance);
                const isOk = vtvStatus === 'ok' && insStatus === 'ok';

                return `
                                <tr>
                                    <td><strong>${v.domain}</strong></td>
                                    <td><span class="badge ${vtvStatus === 'ok' ? 'success' : vtvStatus}">${v.vtv}</span></td>
                                    <td><span class="badge ${insStatus === 'ok' ? 'success' : insStatus}">${v.insurance}</span></td>
                                    <td>
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                                            <span class="badge ${isOk ? 'success' : 'danger'}">
                                                ${isOk ? 'Habilitado' : 'Bloqueado'}
                                            </span>
                                            ${isAdmin ? `
                                                <div style="display: flex; gap: 0.25rem;">
                                                    <button class="btn" style="padding: 0.25rem; background: #f1f5f9" onclick="window.app.editVehicle('${p.id}', '${v.id}')"><i data-lucide="edit" style="width: 14px; height: 14px;"></i></button>
                                                    <button class="btn" style="padding: 0.25rem; background: #fee2e2; color: #991b1b" onclick="window.app.deleteVehicle('${p.id}', '${v.id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}
    `;
    if (window.lucide) window.lucide.createIcons();
}

function handleNav(view, id = null) {
    console.log('Navigation Event:', view, id);
    AppState.currentView = view;
    if (id) AppState.currentProviderId = id;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) item.classList.add('active');
    });

    const titles = {
        dashboard: 'Dashboard',
        providers: 'Gestión de Proveedores',
        providerDetail: 'Detalle de Proveedor',
        vehicles: 'Control de Flota'
    };
    viewTitle.textContent = titles[view] || 'Sistema PSS';

    if (view === 'dashboard') renderDashboard();
    else if (view === 'providers') renderProviders();
    else if (view === 'providerDetail') renderProviderDetail(AppState.currentProviderId);
    else if (view === 'vehicles') renderVehicles();
}

// Global Export
window.app = {
    handleNav,
    addProvider: () => {
        const name = prompt("Nombre del Proveedor:");
        const cuit = prompt("CUIT:");
        if (name && cuit) {
            const newP = {
                id: 'p' + Date.now(),
                name,
                cuit,
                docs: {
                    cuit: { status: 'none', expiry: '' },
                    estatuto: { status: 'none', expiry: '' },
                    aportes: { status: 'none', expiry: '' },
                    art: { status: 'none', expiry: '' },
                    rc: { status: 'none', expiry: '' },
                    pss: { status: 'none', expiry: '' },
                    emergencia: { status: 'none', expiry: '' },
                    iso: { status: 'none', expiry: '' },
                    firma: { status: 'none', expiry: '' }
                },
                personnel: [],
                vehicles: []
            };
            store.addProvider(newP);
            handleNav('providers');
        }
    },
    deleteProvider: (id) => {
        if (confirm("¿Está seguro de eliminar este proveedor?")) {
            store.deleteProvider(id);
            handleNav('providers');
        }
    },
    editProvider: (id) => {
        const p = store.getProviders().find(prov => prov.id === id);
        if (!p) return;
        const name = prompt("Nombre del Proveedor:", p.name);
        const cuit = prompt("CUIT:", p.cuit);
        if (name && cuit) {
            store.updateProvider(id, { name, cuit });
            handleNav('providers');
        }
    },
    scanPDF: async (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const typedarray = new Uint8Array(reader.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = "";

                    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        fullText += content.items.map(item => item.str).join(" ");
                    }

                    const result = {
                        dates: [],
                        domains: [],
                        names: []
                    };

                    // Regex for dates (Supports DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, and 2-digit years)
                    const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b|\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g;
                    const dateMatches = fullText.match(dateRegex);
                    if (dateMatches) {
                        result.dates = [...new Set(dateMatches.map(m => {
                            const clean = m.replace(/[\/\.]/g, '-');
                            const parts = clean.split('-');
                            if (parts[0].length === 4) {
                                return clean;
                            } else {
                                let d = parts[0].padStart(2, '0');
                                let m = parts[1].padStart(2, '0');
                                let y = parts[2];
                                if (y.length === 2) y = '20' + y;
                                return `${y}-${m}-${d}`;
                            }
                        }).filter(d => {
                            const date = new Date(d);
                            return date instanceof Date && !isNaN(date);
                        }))].sort((a, b) => Date.parse(b) - Date.parse(a));
                    }

                    // Regex for domains (Patentes Argentina: AAA 111 or AA 111 BB)
                    const domainRegex = /\b([A-Z]{3}\s?\d{3})\b|\b([A-Z]{2}\s?\d{3}\s?[A-Z]{2})\b/g;
                    const domainMatches = fullText.match(domainRegex);
                    if (domainMatches) {
                        result.domains = [...new Set(domainMatches.map(m => m.replace(/\s/g, '').toUpperCase()))];
                    }

                    // Heuristic for names (Expanded keywords for Argentinian documents)
                    const nameRegex = /(?:NOMBRE|CAPACITADO|TITULAR|CONDUCTOR|PERSONAL|RAZÓN SOCIAL|ASEGURADO|EMPLEADO):\s?([A-ZÁÉÍÓÚÑ]{2,}(?:\s[A-ZÁÉÍÓÚÑ]{2,})+)/i;
                    const nameMatch = fullText.match(nameRegex);
                    if (nameMatch) {
                        result.names.push(nameMatch[1].trim());
                    }

                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    },
    editDoc: (providerId, key) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        const choice = confirm("¿Desea escanear un PDF para el vencimiento?");
        if (choice) {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const data = await window.app.scanPDF(file);
                if (data.dates.length > 0) {
                    const d = prompt("Se detectaron fechas. Elija o ingrese una (YYYY-MM-DD):", data.dates[0]);
                    if (d) { store.updateDoc(providerId, key, d); renderProviderDetail(providerId); }
                } else {
                    alert("No se detectaron fechas."); window.app.editDocManual(providerId, key);
                }
            };
            input.click();
        } else { window.app.editDocManual(providerId, key); }
    },
    editDocManual: (providerId, key) => {
        const newExpiry = prompt("Nueva fecha de vencimiento (YYYY-MM-DD):");
        if (newExpiry) { store.updateDoc(providerId, key, newExpiry); renderProviderDetail(providerId); }
    },
    deletePersonnel: (providerId, personId) => {
        if (confirm("¿Eliminar este integrante del personal?")) {
            store.deletePersonnel(providerId, personId);
            renderProviderDetail(providerId);
        }
    },
    editPersonnel: (providerId, personId) => {
        const p = store.getProviders().find(prov => prov.id === providerId);
        if (!p) return;
        const per = p.personnel.find(ps => ps.id === personId);
        if (!per) return;

        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.pdf';

        const choice = confirm("¿Desea escanear un PDF para actualizar los datos?");
        if (choice) {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const data = await window.app.scanPDF(file);
                const name = prompt("Nombre:", data.names[0] || per.name);
                const med = prompt("Vencimiento Apto Médico:", data.dates[0] || per.docs.medical);
                const safety = prompt("Vencimiento Seguridad:", data.dates[1] || data.dates[0] || per.docs.safety);
                if (name && med && safety) {
                    store.updatePersonnel(providerId, personId, { name, docs: { medical: med, safety: safety } });
                    renderProviderDetail(providerId);
                }
            };
            input.click();
        } else {
            const name = prompt("Nombre:", per.name);
            const med = prompt("Apto Médico:", per.docs.medical);
            const safety = prompt("Seguridad:", per.docs.safety);
            if (name && med && safety) {
                store.updatePersonnel(providerId, personId, { name, docs: { medical: med, safety: safety } });
                renderProviderDetail(providerId);
            }
        }
    },
    addPersonnel: (providerId) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.pdf';
        const choice = confirm("¿Desea escanear un PDF para cargar el personal?");
        if (choice) {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const data = await window.app.scanPDF(file);
                const name = prompt("Nombre detectado:", data.names[0] || "");
                const med = prompt("Vencimiento Apto Médico:", data.dates[0] || "");
                const safety = prompt("Vencimiento Seguridad:", data.dates[1] || data.dates[0] || "");
                if (name && med && safety) {
                    store.addPersonnel(providerId, { id: 'per' + Date.now(), name, authorized: true, docs: { medical: med, safety: safety } });
                    renderProviderDetail(providerId);
                }
            };
            input.click();
        } else {
            const name = prompt("Nombre del integrante:");
            const med = prompt("Vencimiento Apto Médico (YYYY-MM-DD):");
            const safety = prompt("Vencimiento Capacitación Seguridad (YYYY-MM-DD):");
            if (name && med && safety) {
                store.addPersonnel(providerId, { id: 'per' + Date.now(), name, authorized: true, docs: { medical: med, safety: safety } });
                renderProviderDetail(providerId);
            }
        }
    },
    addVehicle: () => {
        const providers = store.getProviders();
        if (providers.length === 0) return alert("Debe cargar un proveedor primero.");

        let pId = providers[0].id;
        if (providers.length > 1) {
            const names = providers.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
            const choice = prompt(`Seleccione el proveedor (1-${providers.length}):\n${names}`);
            const idx = parseInt(choice) - 1;
            if (providers[idx]) pId = providers[idx].id;
            else return;
        }

        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.pdf';
        const choice = confirm("¿Desea escanear un PDF para cargar el vehículo?");

        if (choice) {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const data = await window.app.scanPDF(file);
                const domain = prompt("Dominio detectado:", data.domains[0] || "");
                const vtv = prompt("Vencimiento VTV:", data.dates[0] || "");
                const ins = prompt("Vencimiento Seguro:", data.dates[1] || data.dates[0] || "");
                if (domain && vtv && ins) {
                    store.addVehicle(pId, { id: 'v' + Date.now(), domain, vtv, insurance: ins });
                    handleNav('vehicles');
                }
            };
            input.click();
        } else {
            const domain = prompt("Dominio del vehículo:");
            const vtv = prompt("Vencimiento VTV (YYYY-MM-DD):");
            const ins = prompt("Vencimiento Seguro (YYYY-MM-DD):");
            if (domain && vtv && ins) {
                store.addVehicle(pId, { id: 'v' + Date.now(), domain, vtv, insurance: ins });
                handleNav('vehicles');
            }
        }
    },
    deleteVehicle: (providerId, vehicleId) => {
        if (confirm("¿Eliminar este vehículo de la flota?")) {
            store.deleteVehicle(providerId, vehicleId);
            handleNav('vehicles');
        }
    },
    editVehicle: (providerId, vehicleId) => {
        const p = store.getProviders().find(prov => prov.id === providerId);
        if (!p) return;
        const v = p.vehicles.find(vh => vh.id === vehicleId);
        if (!v) return;

        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.pdf';
        const choice = confirm("¿Desea escanear un PDF para actualizar los datos del vehículo?");

        if (choice) {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const data = await window.app.scanPDF(file);
                const domain = prompt("Dominio:", data.domains[0] || v.domain);
                const vtv = prompt("Vencimiento VTV:", data.dates[0] || v.vtv);
                const ins = prompt("Vencimiento Seguro:", data.dates[1] || data.dates[0] || v.insurance);
                if (domain && vtv && ins) {
                    store.updateVehicle(providerId, vehicleId, { domain, vtv, insurance: ins });
                    handleNav('vehicles');
                }
            };
            input.click();
        } else {
            const domain = prompt("Dominio del vehículo:", v.domain);
            const vtv = prompt("Vencimiento VTV (YYYY-MM-DD):", v.vtv);
            const ins = prompt("Vencimiento Seguro (YYYY-MM-DD):", v.insurance);
            if (domain && vtv && ins) {
                store.updateVehicle(providerId, vehicleId, { domain, vtv, insurance: ins });
                handleNav('vehicles');
            }
        }
    }
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Initial Setup: Force 'consulta' role on every fresh load
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    store.setRole('consulta');
    roleSelect.value = 'consulta';
    currentUserRole.textContent = 'Consulta';

    roleSelect.addEventListener('change', (e) => {
        const newRole = e.target.value;
        if (newRole === 'admin') {
            const _0x1a2b = prompt("Ingrese contraseña de administrador:");
            const _0x3f4c = (s) => btoa(s);
            if (_0x3f4c(_0x1a2b) !== 'YWRtaW4=') {
                alert("Contraseña incorrecta.");
                roleSelect.value = 'consulta';
                return;
            }
        }
        store.setRole(newRole);
        currentUserRole.textContent = newRole.charAt(0).toUpperCase() + newRole.slice(1);
        handleNav(AppState.currentView, AppState.currentProviderId);
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            AppState.searchFilter = ''; // Clear search when navigating
            handleNav(item.dataset.view);
        });
    });

    handleNav('dashboard');

    // Initialize Store with Firebase
    store.onSync = () => {
        handleNav(AppState.currentView, AppState.currentProviderId);
    };
    store.init();

    // PWA: Check for standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running in PWA mode - Mobile Optimized');
        // Force consulta role always in app mode if desired
        // store.setRole('consulta'); 
    }

    // PWA: Install Prompt Handle
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Optionally show an install button somewhere
        console.log('PWA Install Prompt available');
    });
});

