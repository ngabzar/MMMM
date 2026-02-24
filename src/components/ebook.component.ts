import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../services/translation.service';
import { ebooks, EBook, EBookCategory, searchEbooks, getEbooksByLevel, getEbooksByCategory, categoryLabels } from '../data/ebook/ebook';

@Component({
  selector: 'app-ebook',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen pb-24 transition-colors duration-300"
         [class.bg-slate-950]="ts.isDarkMode()" [class.bg-gray-50]="!ts.isDarkMode()"
         [class.text-white]="ts.isDarkMode()" [class.text-slate-900]="!ts.isDarkMode()">

      <!-- Header -->
      <div class="sticky top-0 z-20 p-4 border-b transition-colors"
           [class.bg-slate-950]="ts.isDarkMode()" [class.border-slate-800]="ts.isDarkMode()"
           [class.bg-white]="!ts.isDarkMode()" [class.border-gray-200]="!ts.isDarkMode()">
        
        <!-- Title row -->
        <div class="flex items-center gap-4 mb-3">
          <button (click)="closeReader()" *ngIf="selectedBook()" class="p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 class="text-xl font-bold">📚 Perpustakaan</h1>
          
          <!-- View Toggle -->
          <div class="ml-auto flex gap-1">
            <button (click)="viewMode.set('grid')"
                    class="p-2 rounded-lg transition-all"
                    [class.bg-blue-600]="viewMode() === 'grid'"
                    [class.text-white]="viewMode() === 'grid'"
                    [class.opacity-40]="viewMode() !== 'grid'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
            <button (click)="viewMode.set('list')"
                    class="p-2 rounded-lg transition-all"
                    [class.bg-blue-600]="viewMode() === 'list'"
                    [class.text-white]="viewMode() === 'list'"
                    [class.opacity-40]="viewMode() !== 'list'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Search & Filter (only when not reading) -->
        @if (!selectedBook()) {
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="block w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm transition-all outline-none"
              [class.bg-slate-900]="ts.isDarkMode()" [class.border-slate-700]="ts.isDarkMode()" [class.text-gray-300]="ts.isDarkMode()"
              [class.bg-white]="!ts.isDarkMode()" [class.border-gray-300]="!ts.isDarkMode()" [class.text-gray-900]="!ts.isDarkMode()"
              placeholder="Cari ebook, penulis, atau topik..." />
          </div>

          <!-- Level Filter -->
          <div class="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
            @for (level of levelFilters; track level) {
              <button (click)="filterLevel.set(level)"
                      class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      [class.bg-blue-600]="filterLevel() === level"
                      [class.text-white]="filterLevel() === level"
                      [class.bg-slate-800]="ts.isDarkMode() && filterLevel() !== level"
                      [class.text-slate-300]="ts.isDarkMode() && filterLevel() !== level"
                      [class.bg-gray-200]="!ts.isDarkMode() && filterLevel() !== level"
                      [class.text-slate-600]="!ts.isDarkMode() && filterLevel() !== level">
                {{ level === 'ALL' ? 'Semua' : level }}
              </button>
            }
          </div>
        }
      </div>

      <!-- PDF Reader -->
      @if (selectedBook()) {
        <div class="p-4">
          <div class="mb-4 rounded-2xl border p-4"
               [class.bg-slate-900]="ts.isDarkMode()" [class.border-slate-800]="ts.isDarkMode()"
               [class.bg-white]="!ts.isDarkMode()" [class.border-gray-200]="!ts.isDarkMode()">
            <div class="flex items-center gap-3">
              <div class="w-12 h-16 rounded-lg flex items-center justify-center text-2xl text-white bg-gradient-to-br shrink-0" 
                   [class]="selectedBook()!.coverColor">
                {{ selectedBook()!.coverEmoji }}
              </div>
              <div>
                <h2 class="font-bold leading-tight" [class.text-white]="ts.isDarkMode()" [class.text-slate-900]="!ts.isDarkMode()">
                  {{ selectedBook()!.title }}
                </h2>
                <p class="text-xs mt-0.5" [class.text-slate-400]="ts.isDarkMode()" [class.text-slate-500]="!ts.isDarkMode()">
                  {{ selectedBook()!.author }} • {{ selectedBook()!.totalPages || '?' }} hal
                </p>
                <div class="flex gap-2 mt-1">
                  <span class="text-xs px-2 py-0.5 rounded-full"
                        [class.bg-slate-700]="ts.isDarkMode()" [class.text-slate-300]="ts.isDarkMode()"
                        [class.bg-gray-200]="!ts.isDarkMode()" [class.text-slate-600]="!ts.isDarkMode()">
                    {{ selectedBook()!.level }}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full"
                        [class.bg-blue-900]="ts.isDarkMode()" [class.text-blue-300]="ts.isDarkMode()"
                        [class.bg-blue-100]="!ts.isDarkMode()" [class.text-blue-700]="!ts.isDarkMode()">
                    {{ getCategoryLabel(selectedBook()!.category) }}
                  </span>
                </div>
              </div>
            </div>
            <p class="text-sm mt-3 leading-relaxed" [class.text-slate-300]="ts.isDarkMode()" [class.text-slate-600]="!ts.isDarkMode()">
              {{ selectedBook()!.description }}
            </p>
            
            <!-- Open PDF Button -->
            <a [href]="selectedBook()!.source" 
               target="_blank" 
               class="mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm bg-blue-600 text-white transition-all active:scale-95">
              📖 Buka PDF Sekarang
            </a>
          </div>
        </div>
      }

      <!-- Book Grid / List -->
      @if (!selectedBook()) {
        <div class="p-4">
          <!-- Stats -->
          <div class="text-xs mb-4" [class.text-slate-500]="ts.isDarkMode()" [class.text-slate-400]="!ts.isDarkMode()">
            Menampilkan {{ filteredBooks().length }} dari {{ allBooks.length }} ebook
          </div>

          <!-- Grid View -->
          @if (viewMode() === 'grid') {
            <div class="grid grid-cols-2 gap-3">
              @for (book of filteredBooks(); track book.id) {
                <div (click)="openBook(book)"
                     class="rounded-2xl border overflow-hidden cursor-pointer transition-all active:scale-95"
                     [class.bg-slate-900]="ts.isDarkMode()" [class.border-slate-800]="ts.isDarkMode()"
                     [class.bg-white]="!ts.isDarkMode()" [class.border-gray-200]="!ts.isDarkMode()">
                  
                  <!-- Cover -->
                  <div class="h-32 flex items-center justify-center text-5xl text-white bg-gradient-to-br relative"
                       [class]="book.coverColor">
                    {{ book.coverEmoji }}
                    <div class="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-white">
                      {{ book.level }}
                    </div>
                    @if (book.isFree) {
                      <div class="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500 text-white">
                        GRATIS
                      </div>
                    }
                  </div>
                  
                  <!-- Info -->
                  <div class="p-3">
                    <h3 class="font-bold text-xs leading-tight mb-1 line-clamp-2" 
                        [class.text-white]="ts.isDarkMode()" [class.text-slate-900]="!ts.isDarkMode()">
                      {{ book.title }}
                    </h3>
                    <p class="text-[10px] leading-tight line-clamp-2" 
                       [class.text-slate-400]="ts.isDarkMode()" [class.text-slate-500]="!ts.isDarkMode()">
                      {{ book.description }}
                    </p>
                    @if (book.rating) {
                      <div class="flex items-center gap-1 mt-1">
                        <span class="text-yellow-500 text-xs">⭐</span>
                        <span class="text-[10px] font-semibold text-yellow-500">{{ book.rating }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- List View -->
          @if (viewMode() === 'list') {
            <div class="space-y-3">
              @for (book of filteredBooks(); track book.id) {
                <div (click)="openBook(book)"
                     class="rounded-2xl border overflow-hidden cursor-pointer transition-all active:scale-95 flex items-center gap-3 p-3"
                     [class.bg-slate-900]="ts.isDarkMode()" [class.border-slate-800]="ts.isDarkMode()"
                     [class.bg-white]="!ts.isDarkMode()" [class.border-gray-200]="!ts.isDarkMode()">
                  
                  <!-- Mini cover -->
                  <div class="w-12 h-16 rounded-lg flex items-center justify-center text-2xl text-white bg-gradient-to-br shrink-0"
                       [class]="book.coverColor">
                    {{ book.coverEmoji }}
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex gap-1 mb-1">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            [class.bg-slate-700]="ts.isDarkMode()" [class.text-slate-300]="ts.isDarkMode()"
                            [class.bg-gray-200]="!ts.isDarkMode()" [class.text-slate-600]="!ts.isDarkMode()">
                        {{ book.level }}
                      </span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded"
                            [class.bg-blue-900]="ts.isDarkMode()" [class.text-blue-300]="ts.isDarkMode()"
                            [class.bg-blue-100]="!ts.isDarkMode()" [class.text-blue-700]="!ts.isDarkMode()">
                        {{ getCategoryLabel(book.category) }}
                      </span>
                    </div>
                    <h3 class="font-bold text-sm leading-tight truncate" 
                        [class.text-white]="ts.isDarkMode()" [class.text-slate-900]="!ts.isDarkMode()">
                      {{ book.title }}
                    </h3>
                    <p class="text-xs truncate mt-0.5" 
                       [class.text-slate-400]="ts.isDarkMode()" [class.text-slate-500]="!ts.isDarkMode()">
                      {{ book.author }} • {{ book.totalPages || '?' }} hal
                    </p>
                    @if (book.rating) {
                      <div class="flex items-center gap-0.5 mt-0.5">
                        <span class="text-yellow-500 text-xs">⭐ {{ book.rating }}</span>
                      </div>
                    }
                  </div>

                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 opacity-40 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              }
            </div>
          }

          @if (filteredBooks().length === 0) {
            <div class="text-center py-12">
              <div class="text-5xl mb-4">📭</div>
              <p class="font-semibold" [class.text-white]="ts.isDarkMode()" [class.text-slate-900]="!ts.isDarkMode()">
                Tidak ada ebook ditemukan
              </p>
              <p class="text-sm mt-1" [class.text-slate-400]="ts.isDarkMode()" [class.text-slate-500]="!ts.isDarkMode()">
                Coba kata kunci lain atau ubah filter
              </p>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class EbookComponent {
  ts = inject(TranslationService);
  
  allBooks = ebooks;
  viewMode = signal<'grid' | 'list'>('grid');
  selectedBook = signal<EBook | null>(null);
  searchQuery = '';
  filterLevel = signal<string>('ALL');

  levelFilters = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1', 'JFT'];

  filteredBooks = computed(() => {
    let result = this.allBooks;
    
    if (this.filterLevel() !== 'ALL') {
      result = result.filter(b => b.level === this.filterLevel() || b.level === 'ALL');
    }
    
    if (this.searchQuery.trim()) {
      result = searchEbooks(this.searchQuery);
      if (this.filterLevel() !== 'ALL') {
        result = result.filter(b => b.level === this.filterLevel() || b.level === 'ALL');
      }
    }
    
    return result;
  });

  onSearch() {
    // Computed signal akan otomatis update
  }

  openBook(book: EBook) {
    this.selectedBook.set(book);
  }

  closeReader() {
    this.selectedBook.set(null);
  }

  getCategoryLabel(category: string): string {
    return categoryLabels[category as EBookCategory] || category;
  }
}
