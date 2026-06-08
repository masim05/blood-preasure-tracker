//
//  ContentView.swift
//  Blood pressure tracker
//
//  Created by Max R on 7/6/2569 BE.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        switch appState.route {
        case .auth:
            AuthView()
        case .guide:
            GuideView()
        default:
            mainTabView
        }
    }

    private var mainTabView: some View {
        TabView {
            NavigationStack {
                CameraView()
                    .navigationDestination(isPresented: Binding(
                        get: { appState.route == .measurementDetail },
                        set: { if !$0 { appState.goBack() } }
                    )) {
                        MeasurementDetailView()
                    }
            }
            .tabItem {
                Label("Camera", systemImage: "camera")
            }

            NavigationStack {
                HistoryView()
                    .navigationDestination(isPresented: Binding(
                        get: { appState.route == .measurementDetail },
                        set: { if !$0 { appState.goBack() } }
                    )) {
                        MeasurementDetailView()
                    }
            }
            .tabItem {
                Label("History", systemImage: "list.bullet")
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
        }
        .accentColor(AppColors.primaryGreen)
    }
}

