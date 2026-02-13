// Initial Mock Data
const INITIAL_DATA = {
    providers: [
        {
            id: 'p1',
            name: 'Constructora S.A.',
            cuit: '30-12345678-9',
            docs: {
                cuit: { status: 'ok', expiry: '2026-12-31' },
                estatuto: { status: 'warning', expiry: '2026-03-15' },
                aportes: { status: 'error', expiry: '2026-02-01' },
                art: { status: 'ok', expiry: '2026-06-30' },
                rc: { status: 'ok', expiry: '2026-08-20' },
                pss: { status: 'ok', expiry: '2026-09-10' },
                emergencia: { status: 'ok', expiry: '2027-01-01' },
                iso: { status: 'ok', expiry: '2028-01-01' },
                firma: { status: 'ok', expiry: '2030-01-01' }
            },
            personnel: [
                { id: 'per1', name: 'Juan Pérez', authorized: true, docs: { medical: '2026-10-10', safety: '2026-11-12' } },
                { id: 'per2', name: 'Maria Lopez', authorized: false, docs: { medical: '2026-01-01', safety: '2026-12-12' } }
            ],
            vehicles: [
                { id: 'v1', domain: 'AF123JK', vtv: '2026-05-10', insurance: '2026-07-20' },
                { id: 'v2', domain: 'OL987MM', vtv: '2026-01-15', insurance: '2026-04-10' }
            ]
        }
    ],
    role: 'consulta'
};

class Store {
    constructor() {
        const saved = localStorage.getItem('veolia_doc_data');
        this.data = saved ? JSON.parse(saved) : INITIAL_DATA;
        this.listeners = [];
    }

    save() {
        localStorage.setItem('veolia_doc_data', JSON.stringify(this.data));
        this.listeners.forEach(l => l(this.data));
    }

    subscribe(listener) {
        this.listeners.push(listener);
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

    addPersonnel(providerId, person) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            p.personnel.push(person);
            this.save();
        }
    }

    addVehicle(providerId, vehicle) {
        const p = this.data.providers.find(p => p.id === providerId);
        if (p) {
            p.vehicles.push(vehicle);
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

export const store = new Store();
export default store;
