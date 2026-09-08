import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Category {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: { total?: number } | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private api = inject(ApiService);

  /** Reactive list of all categories — kept in sync after mutations. */
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  /** GET /categories — public endpoint, ordered by nameEn asc */
  loadAll(): Observable<ApiResponse<Category[]>> {
    this.loading.set(true);
    return this.api.get<ApiResponse<Category[]>>('/categories').pipe(
      tap({
        next: res => {
          this.categories.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  /** POST /admin/categories */
  create(payload: { nameAr: string; nameEn: string }): Observable<ApiResponse<Category>> {
    return this.api.post<ApiResponse<Category>>('/admin/categories', payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.update(list => [...list, res.data].sort((a, b) => a.nameEn.localeCompare(b.nameEn)));
        }
      })
    );
  }

  /** PATCH /admin/categories/:id */
  update(id: string, payload: { nameAr?: string; nameEn?: string }): Observable<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`/admin/categories/${id}`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.categories.update(list =>
            list.map(c => c.id === id ? res.data : c)
                .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
          );
        }
      })
    );
  }

  /** DELETE /admin/categories/:id */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.api.delete<ApiResponse<null>>(`/admin/categories/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.categories.update(list => list.filter(c => c.id !== id));
        }
      })
    );
  }
}
