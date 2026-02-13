import { store } from './store.js';

const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');
const roleSelect = document.getElementById('role-select');
const currentUserRole = document.getElementById('current-user-role');

function renderDashboard() {
    const providers = store.getProviders();
    let totalVencidos = 0;
    let totalAlertas = 0;
    let totalOk = 0;

    providers.forEach(p => {
        Object.values(p.docs).forEach(doc => {
            if (doc.status === 'error') totalVencidos++;
            else if (doc.status === 'warning') totalAlertas++;
            else totalOk++;
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
            <h2>Estados de Proveedores</h2>
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
        const hasError = Object.values(p.docs).some(d => d.status === 'error');
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
}

function renderProviders() {
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
                        <th>Documentación</th>
                        <th>Personal</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${providers.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.cuit}</td>
                            <td>${Object.keys(p.docs).length} archivos</td>
                            <td>${p.personnel.length} personas</td>
                            <td>
                                <button class="btn" style="background: #f1f5f9" onclick="window.app.handleNav('providerDetail', '${p.id}')">Gestionar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderProviderDetail(providerId) {
    const p = store.getProviders().find(p => p.id === providerId);
    if (!p) return;

    viewTitle.textContent = `Detalle: ${p.name}`;

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
            <button class="btn" onclick="window.app.handleNav('providers')"><i data-lucide="arrow-left"></i> Volver</button>
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
                        ${Object.entries(p.docs).map(([key, doc]) => {
        const status = store.checkExpiry(doc.expiry);
        return `
                                <tr>
                                    <td>${docLabels[key] || key}</td>
                                    <td>${doc.expiry}</td>
                                    <td><span class="badge ${status === 'ok' ? 'success' : status}">${status === 'ok' ? 'Vigente' : (status === 'warning' ? 'Por Vencer' : 'Vencido')}</span></td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h3>Personal Afectado</h3>
                <table style="margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Estado Ingreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${p.personnel.map(per => {
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
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderVehicles() {
    const providers = store.getProviders();
    const isAdmin = store.getRole() === 'admin';

    viewContainer.innerHTML = `
        <div class="top-actions" style="margin-bottom: 2rem; display: flex; justify-content: flex-end;">
            ${isAdmin ? '<button class="btn btn-primary"><i data-lucide="plus"></i> Agregar Vehículo</button>' : ''}
        </div>
        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Proveedor</th>
                        <th>Dominio</th>
                        <th>VTV</th>
                        <th>Seguro</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${providers.flatMap(p => p.vehicles.map(v => {
        const vtvStatus = store.checkExpiry(v.vtv);
        const insStatus = store.checkExpiry(v.insurance);
        const isOk = vtvStatus === 'ok' && insStatus === 'ok';

        return `
                            <tr>
                                <td>${p.name}</td>
                                <td><strong>${v.domain}</strong></td>
                                <td><span class="badge ${vtvStatus === 'ok' ? 'success' : vtvStatus}">${v.vtv}</span></td>
                                <td><span class="badge ${insStatus === 'ok' ? 'success' : insStatus}">${v.insurance}</span></td>
                                <td>
                                    <span class="badge ${isOk ? 'success' : 'danger'}">
                                        ${isOk ? 'Habilitado' : 'Bloqueado'}
                                    </span>
                                </td>
                            </tr>
                        `;
    })).join('')}
                </tbody>
            </table>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleNav(view, id = null) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    const titles = {
        dashboard: 'Dashboard',
        providers: 'Gestión de Proveedores',
        providerDetail: 'Detalle de Proveedor',
        vehicles: 'Control de Flota'
    };
    viewTitle.textContent = titles[view];

    if (view === 'dashboard') renderDashboard();
    if (view === 'providers') renderProviders();
    if (view === 'providerDetail') renderProviderDetail(id);
    if (view === 'vehicles') renderVehicles();
}

// Global Export for inline onclick
window.app = {
    handleNav,
    addProvider: () => {
        const name = prompt("Nombre del Proveedor:");
        const cuit = prompt("CUIT:");
        if (name && cuit) {
            store.addProvider({
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
            });
            handleNav('providers');
        }
    }
};

// Initial Setup
roleSelect.value = store.getRole();
currentUserRole.textContent = roleSelect.value.charAt(0).toUpperCase() + roleSelect.value.slice(1);

roleSelect.addEventListener('change', (e) => {
    store.setRole(e.target.value);
    currentUserRole.textContent = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
    const activeView = document.querySelector('.nav-item.active').dataset.view;
    handleNav(activeView);
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => handleNav(item.dataset.view));
});

// Start at dashboard
handleNav('dashboard');
