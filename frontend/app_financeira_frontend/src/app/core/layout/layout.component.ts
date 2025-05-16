import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para ngIf, ngFor, etc. em templates standalone
import { RouterOutlet, RouterLink } from '@angular/router'; // Para navegação

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  // Exemplo de Signal
  appName = signal<string>("Minha Aplicação Financeira");
  currentTime = signal<Date>(new Date());

  // Exemplo de Computed Signal
  welcomeMessage = computed(() => `Bem-vindo à ${this.appName()}!`);

  constructor() {
    // Exemplo de Effect para atualizar a hora a cada segundo
    effect((onCleanup) => {
      const timer = setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
      onCleanup(() => clearInterval(timer));
    });

    // Exemplo de Effect para logar mudanças no appName (apenas para demonstração)
    effect(() => {
      console.log(`O nome da aplicação mudou para: ${this.appName()}`);
    });
  }

  changeAppName() {
    // Exemplo de como modificar um signal
    this.appName.set("Gestor Financeiro Pessoal v2");
  }
}
