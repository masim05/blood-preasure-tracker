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
        TabView(selection: Binding(
            get: { 
                switch appState.route {
                case .camera: return 0
                case .history: return 1
                case .profile: return 2
                default: return 0
                }
            },
            set: { newValue in
                switch newValue {
                case 0: appState.route = .camera
                case 1: appState.route = .history
                case 2: appState.route = .profile
                default: break
                }
            }
        )) {
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
            .tag(0)

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
            .tag(1)

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
            .tag(2)
        }
        .accentColor(AppColors.primaryGreen)
    }
}

