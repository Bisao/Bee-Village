
export default class NPCControlPanel {
    constructor(scene) {
        this.scene = scene;
    }

    show(npc) {
        // Remove painéis anteriores
        const existingPanel = document.querySelector('.npc-control-panel');
        if (existingPanel) existingPanel.remove();

        // Cria o painel
        const panel = document.createElement('div');
        panel.className = 'npc-control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            color: white;
            text-align: center;
        `;

        // Título
        const title = document.createElement('h2');
        title.textContent = `${npc.config.name}`;
        title.style.cssText = `
            margin: 0 0 15px 0;
            text-align: center;
            width: 100%;
            font-size: 1.4em;
            padding: 5px 0;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        `;
        panel.appendChild(title);

        // Lista de trabalhos
        const jobsList = this.createJobsList(npc);
        panel.appendChild(jobsList);

        // Botão fechar
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar Painel';
        closeButton.style.cssText = `
            margin-top: 15px;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            background-color: #d9534f;
            color: white;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: background-color 0.3s ease;
        `;
        closeButton.onclick = () => panel.remove();
        panel.appendChild(closeButton);

        document.body.appendChild(panel);
    }

    createJobsList(npc) {
        const jobsList = document.createElement('div');
        jobsList.className = 'jobs-list';
        jobsList.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;

        const availableJobs = this.getAvailableJobs(npc);
        availableJobs.forEach(job => {
            const button = this.createJobButton(job, npc);
            jobsList.appendChild(button);
        });

        return jobsList;
    }

    createJobButton(job, npc) {
        const button = document.createElement('button');
        button.textContent = `${job.icon} ${job.name}`;
        button.dataset.job = job.id;
        button.style.cssText = `
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            background-color: #5cb85c;
            color: white;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background-color 0.3s ease;
        `;

        button.onclick = () => this.handleJobSelection(job, npc);
        return button;
    }

    handleJobSelection(job, npc) {
        switch (job.id) {
            case 'lumber':
                if (npc.config.profession === 'Lumberjack') {
                    if (!npc.lumberSystem) {
                        npc.lumberSystem = new LumberSystem(this.scene);
                    }
                    npc.isAutonomous = false;
                    npc.currentJob = 'lumber';
                    npc.config.emoji = '🪓';
                    npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                    npc.lumberSystem.startWorking(npc);
                }
                break;
            case 'miner':
                if (npc.config.profession === 'Miner') {
                    if (!npc.mineSystem) {
                        npc.mineSystem = new MineSystem(this.scene);
                    }
                    npc.isAutonomous = false;
                    npc.currentJob = 'miner';
                    npc.config.emoji = '⛏️';
                    npc.nameText.setText(`${npc.config.emoji} ${npc.config.name}`);
                    npc.mineSystem.startWorking(npc);
                }
                break;
        }
    }

    getAvailableJobs(npc) {
        const jobs = [];
        
        if (npc.config.profession === 'Lumberjack') {
            jobs.push({ id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' });
            jobs.push({ 
                id: 'lumber', 
                name: 'Cortar Madeira', 
                icon: '🪓', 
                description: 'Corta árvores e coleta madeira.' 
            });
        } else if (npc.config.profession === 'Miner') {
            jobs.push({ id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' });
            jobs.push({
                id: 'miner',
                name: 'Minerar',
                icon: '⛏️',
                description: 'Minera rochas e coleta minérios.'
            });
        } else {
            jobs.push({ id: 'idle', name: 'Descanso', icon: '☕', description: 'Não faz nada.' });
        }

        return jobs;
    }
}
