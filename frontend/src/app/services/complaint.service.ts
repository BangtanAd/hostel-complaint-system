import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppNotification, Complaint, ComplaintStats } from '../models/types';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComplaintService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  createComplaint(data: {
    title: string;
    category: string;
    priority: string;
    description: string;
  }): Observable<Complaint> {
    return this.http.post<Complaint>(`${this.baseUrl}/complaints`, data);
  }

  getMyComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/complaints/my`);
  }

  deleteComplaint(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/complaints/${id}`);
  }

  getAllComplaints(filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Observable<Complaint[]> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'All') {
      params = params.set('status', filters.status);
    }
    if (filters?.category && filters.category !== 'All') {
      params = params.set('category', filters.category);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    return this.http.get<Complaint[]>(`${this.baseUrl}/complaints`, { params });
  }

  updateComplaint(
    id: string,
    data: { status?: string; adminNote?: string }
  ): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.baseUrl}/complaints/${id}`, data);
  }

  getStats(): Observable<ComplaintStats> {
    return this.http.get<ComplaintStats>(`${this.baseUrl}/complaints/stats`);
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.baseUrl}/notifications`);
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.put<AppNotification>(
      `${this.baseUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {});
  }
}