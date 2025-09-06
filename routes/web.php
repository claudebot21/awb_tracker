<?php

use App\Http\Controllers\PackageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Package;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        $packages = Package::with('events')->orderBy('created_at', 'desc')->get();

        return Inertia::render('dashboard', [
            'packages' => $packages,
        ]);
    })->name('dashboard');

    Route::resource('packages', PackageController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
